import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Robust role detection for Manager / Admin / Client
  const userRoleLower = user?.role?.toLowerCase() || '';
  const isClient = userRoleLower.includes('client') || userRoleLower.includes('reviewer');
  const isManager = userRoleLower.includes('manager') || userRoleLower.includes('admin');
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [logModal, setLogModal] = useState({ isOpen: false, type: 'approved' });
  const [loading, setLoading] = useState(true);

  // Real data states
  const [metrics, setMetrics] = useState({ activeProjects: 0, pendingApprovals: 0, approvedAssets: 0, rejectedOutputs: 0 });
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]); 
  
  const [pendingLogs, setPendingLogs] = useState([]);
  const [approvedLogs, setApprovedLogs] = useState([]);
  const [rejectedLogs, setRejectedLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Artist specific derived metrics
  const [artistStats, setArtistStats] = useState({ personalApproved: 0, personalRejected: 0 });

  // Reusable custom scrollbar styling class (Adapts to Light/Dark Mode)
  const adaptiveScrollbarClass = "overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#333333] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-[#444444]";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Projects
        const projRes = await api.get('/projects').catch(() => ({ data: { projects: [] } }));
        const allProjects = projRes.data.projects || [];
        const activeProj = allProjects.filter(p => p.status === 'active' || p.status === 'planning');
        
        // 2. Fetch Assets & Calculate Metrics
        const assetsRes = await api.get('/assets').catch(() => ({ data: { assets: [] } }));
        const allAssets = assetsRes.data.assets || [];
        
        let pending = 0, approved = 0, rejected = 0;
        let pendingList = [];
        let approvedList = [];
        let rejectedList = [];
        let myApproved = 0, myRejected = 0;
        const currentUserId = user?.id || user?._id;

        allAssets.forEach(asset => {
          const currentVersion = asset.versions?.find(v => v.versionNumber === asset.currentVersion);
          const status = currentVersion?.status || 'pending';
          const projectName = asset.project?.name || 'Unknown Project';
          const projectId = asset.project?._id || asset.project;
          const uploaderId = currentVersion?.uploadedBy?._id || currentVersion?.uploadedBy;
          const uploaderName = currentVersion?.uploadedBy ? `${currentVersion.uploadedBy.firstName || ''} ${currentVersion.uploadedBy.lastName || ''}`.trim() : 'Studio User';
          const uploadDate = currentVersion?.uploadedAt ? new Date(currentVersion.uploadedAt).toLocaleString() : 'Recent';
          
          if (status === 'pending') {
            pending++;
            pendingList.push({
              _id: asset._id,
              asset: asset.title,
              project: projectName,
              projectId: projectId,
              date: uploadDate,
              by: uploaderName
            });
          } else if (status === 'approved') {
            approved++;
            approvedList.push({
              _id: asset._id,
              asset: asset.title,
              project: projectName,
              projectId: projectId,
              date: uploadDate,
              by: uploaderName
            });
            if (uploaderId?.toString() === currentUserId?.toString()) myApproved++;
          } else if (status === 'rejected') {
            rejected++;
            rejectedList.push({
              _id: asset._id,
              asset: asset.title,
              project: projectName,
              projectId: projectId,
              date: uploadDate,
              by: uploaderName,
              reason: currentVersion?.reviewComment || 'Revision Required'
            });
            if (uploaderId?.toString() === currentUserId?.toString()) myRejected++;
          }
        });

        setArtistStats({ personalApproved: myApproved, personalRejected: myRejected });

        // 3. Fetch Tasks with Safe Role Matching & Separation
        const tasksRes = await api.get('/tasks').catch(() => ({ data: { tasks: [] } }));
        const allTasks = tasksRes.data.tasks || [];
        
        let fetchedTasks = allTasks;
        if (isClient) {
          fetchedTasks = fetchedTasks.filter(t => t.status === 'Review');
        } else if (!isManager) {
          fetchedTasks = allTasks.filter(t => {
            const assignedId = t.assignedTo?._id || t.assignedTo?.id || t.assignedTo;
            return !assignedId || assignedId.toString() === currentUserId?.toString();
          });
        }

        // Separate active and completed tasks
        setTasks(fetchedTasks.filter(t => !t.completed));
        setCompletedTasks(fetchedTasks.filter(t => t.completed));

        setMetrics({
          activeProjects: activeProj.length,
          pendingApprovals: pending,
          approvedAssets: approved,
          rejectedOutputs: rejected
        });
        
        setPendingLogs(pendingList);
        setApprovedLogs(approvedList);
        setRejectedLogs(rejectedList);

        // 4. Fetch Comments & Build Comprehensive Activity Stream
        const activityRes = await api.get('/comments').catch(() => ({ data: { comments: [] } }));
        const comments = activityRes.data.comments || [];
        
        const taskActivities = allTasks.map(t => {
            const assigneeName = t.assignedTo ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim() : 'Unassigned';
            return {
                _id: `t-${t._id}`,
                type: 'Task',
                title: `Task: ${t.title}`,
                text: `${t.completed ? 'Completed' : 'Updated'} by ${assigneeName}`,
                createdAt: t.updatedAt || t.createdAt || new Date(),
                user: t.assignedTo,
                asset: t.asset?._id || t.asset,
                project: t.project?._id || t.project
            };
        });

        const assetActivities = allAssets.map(a => {
            const uploader = a.versions?.[0]?.uploadedBy;
            const uploaderName = uploader ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() : 'Studio Member';
            return {
                _id: `a-${a._id}`,
                type: 'Asset',
                title: `Asset: ${a.title}`,
                text: `v${a.currentVersion} uploaded by ${uploaderName}`,
                createdAt: a.updatedAt || a.createdAt || new Date(),
                user: uploader,
                asset: a._id,
                project: a.project?._id || a.project
            };
        });

        const commentActivities = comments.map(c => {
            const commentUser = c.user;
            const userName = commentUser ? `${commentUser.firstName || ''} ${commentUser.lastName || ''}`.trim() : 'Studio Member';
            const actionLabel = c.type === 'revision_request' ? 'Revision requested by' : 'Feedback posted by';
            return {
                _id: `c-${c._id}`,
                type: c.type === 'revision_request' ? 'Revision' : 'Feedback',
                title: c.type === 'revision_request' ? 'Revision Requested' : 'New Feedback',
                text: `${actionLabel} ${userName}`,
                createdAt: c.createdAt || new Date(),
                user: commentUser,
                asset: c.asset?._id || c.asset,
                project: c.project?._id || c.project
            };
        });

        const unifiedActivity = [...taskActivities, ...assetActivities, ...commentActivities]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5); // RESTRICTED TO RECENT 5

        setRecentActivity(unifiedActivity);

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, isClient, isManager]);

  // Helper functions to dynamically render the modal based on type
  const getModalTitle = () => {
    if (logModal.type === 'pending') return 'Pending Approvals Log';
    if (logModal.type === 'approved') return 'Approved Assets Log';
    return 'Revisions & Rejections Log';
  };

  const getModalCount = () => {
    if (logModal.type === 'pending') return metrics.pendingApprovals;
    if (logModal.type === 'approved') return metrics.approvedAssets;
    return metrics.rejectedOutputs;
  };

  const getModalBadgeColor = () => {
    if (logModal.type === 'pending') return 'bg-[#ffd166]/20 text-[#ffd166]';
    if (logModal.type === 'approved') return 'bg-[#10b981]/20 text-[#10b981]';
    return 'bg-[#ff477e]/20 text-[#ff477e]';
  };

  const getActiveLogs = () => {
    if (logModal.type === 'pending') return pendingLogs;
    if (logModal.type === 'approved') return approvedLogs;
    return rejectedLogs;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex items-center justify-center h-[calc(100vh-100px)]">
        <p className="text-gray-400">Loading studio metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full transition-colors duration-300 relative">
      <header className="flex justify-between items-end mb-8 border-b border-[#333333] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Studio Overview</h1>
          <p className="text-gray-400 mt-1 text-sm">Real-time production metrics and pending tasks.</p>
        </div>
        <Link to="/projects" className="btn-primary py-2 px-6 text-sm no-underline">View All Projects</Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => navigate('/projects')}
          className="glass-panel p-5 border-l-4 border-l-[#9d4edd] cursor-pointer hover:bg-white/5 hover:-translate-y-1 transition-all duration-300"
        >
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-white">{metrics.activeProjects}</p>
        </div>
        
        <div 
          onClick={() => setLogModal({ isOpen: true, type: 'pending' })}
          className="glass-panel p-5 border-l-4 border-l-[#ffd166] cursor-pointer hover:bg-white/5 hover:-translate-y-1 transition-all duration-300"
        >
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-white">{metrics.pendingApprovals}</p>
        </div>
        
        <div 
          onClick={() => setLogModal({ isOpen: true, type: 'approved' })}
          className="glass-panel p-5 border-l-4 border-l-[#10b981] cursor-pointer hover:bg-white/5 hover:-translate-y-1 transition-all duration-300"
        >
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Approved Assets</p>
          <p className="text-3xl font-bold text-white">{metrics.approvedAssets}</p>
        </div>
        
        <div 
          onClick={() => setLogModal({ isOpen: true, type: 'rejected' })}
          className="glass-panel p-5 border-l-4 border-l-[#ff477e] cursor-pointer hover:bg-white/5 hover:-translate-y-1 transition-all duration-300"
        >
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Rejected / Revisions</p>
          <p className="text-3xl font-bold text-white">{metrics.rejectedOutputs}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: TASKS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ACTIVE TASKS CONTAINER */}
          <div className="glass-panel p-6 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-6">
              {isClient ? 'Items Awaiting My Review' : isManager ? 'Studio Active Pipeline' : 'My Active Tasks'}
            </h2>
            <div className={`max-h-[350px] ${adaptiveScrollbarClass}`}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333333] text-gray-400 sticky top-0 bg-[#121212] z-10">
                    <th className="pb-3 font-semibold w-2/5">Task Name</th>
                    <th className="pb-3 font-semibold">Assignee</th>
                    <th className="pb-3 font-semibold">Deadline</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">No active tasks found.</td>
                    </tr>
                  ) : (
                    tasks.map(task => {
                      const assigneeName = task.assignedTo ? `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() : 'Unassigned';
                      return (
                        <tr 
                          key={task._id} 
                          onClick={() => navigate(`/project/${task.project?._id || task.project}/asset/${task.asset?._id || task.asset}?tab=tasks`)}
                          className="text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-semibold">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-300 mt-1 italic">{task.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">{task.project?.name || 'Assigned Task'}</p>
                          </td>
                          <td className="py-4 text-gray-300">
                            <span className="bg-[#1e1e1e] border border-[#333333] px-2 py-1 rounded text-xs font-mono">
                              {assigneeName}
                            </span>
                          </td>
                          <td className="py-4">
                            {task.deadline ? (
                              <span className={`text-xs font-bold uppercase ${new Date(task.deadline) < new Date() ? "text-[#ff477e]" : "text-gray-300"}`}>
                                {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">No Deadline</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded text-xs border bg-[#1e1e1e] border-[#333333] text-gray-300">
                              {task.status || 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPLETED TASKS CONTAINER */}
          <div className="glass-panel p-6 flex flex-col opacity-80 hover:opacity-100 transition-opacity">
            <h2 className="text-lg font-bold text-white mb-6">Completed Tasks</h2>
            <div className={`max-h-[300px] ${adaptiveScrollbarClass}`}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333333] text-gray-400 sticky top-0 bg-[#121212] z-10">
                    <th className="pb-3 font-semibold w-2/5">Task Name</th>
                    <th className="pb-3 font-semibold">Assignee</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {completedTasks.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-500">No completed tasks yet.</td>
                    </tr>
                  ) : (
                    completedTasks.map(task => {
                      const assigneeName = task.assignedTo ? `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() : 'Unassigned';
                      return (
                        <tr 
                          key={task._id} 
                          onClick={() => navigate(`/project/${task.project?._id || task.project}/asset/${task.asset?._id || task.asset}?tab=tasks`)}
                          className="text-gray-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-semibold line-through text-gray-500">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{task.project?.name || 'Assigned Task'}</p>
                          </td>
                          <td className="py-4">
                            <span className="bg-[#121212] border border-[#333333] px-2 py-1 rounded text-xs font-mono text-gray-500">
                              {assigneeName}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded text-xs border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30">
                              Completed
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RECENT OUTPUT ACTIVITY CONTAINER */}
        <div className="glass-panel p-6 flex flex-col h-fit sticky top-8">
          <h2 className="text-lg font-bold text-white mb-6">Recent Output Activity</h2>
          <div className={`space-y-4 max-h-[500px] ${adaptiveScrollbarClass}`}>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
            ) : (
              recentActivity.map((activity) => (
                <div 
                  key={activity._id}
                  onClick={() => activity.asset && activity.project ? navigate(`/project/${activity.project}/asset/${activity.asset}?tab=comments`) : null}
                  className="flex gap-4 p-3 bg-[#121212] rounded-lg border border-[#333333] hover:border-[#9d4edd] transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded bg-[#9d4edd]/20 text-[#9d4edd] flex items-center justify-center font-bold text-xs shrink-0">
                    {activity.user?.firstName ? activity.user.firstName.substring(0, 2).toUpperCase() : 'SYS'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {activity.text} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* ROLE-BASED REPORT BUTTON */}
          <button onClick={() => setIsReportOpen(true)} className="w-full mt-6 py-2 bg-[#121212] border border-[#333333] text-white rounded-md text-sm font-semibold hover:bg-white/5 transition-colors">
            {isManager || isClient ? 'View Executive Report' : 'View My Performance Report'}
          </button>
        </div>
      </div>

      {/* ASSET LOG MODAL (Handles Pending, Approved, and Rejected) */}
      {logModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="bg-[#1e1e1e] px-8 py-6 border-b border-[#333333] flex justify-between items-center shrink-0 shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {getModalTitle()}
                  <span className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider ${getModalBadgeColor()}`}>
                    {getModalCount()} TOTAL
                  </span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Recent quality control history.</p>
              </div>
              <button 
                onClick={() => setLogModal(prev => ({ ...prev, isOpen: false }))} 
                className="w-8 h-8 rounded-full bg-[#121212] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >✕</button>
            </div>
            
            <div className={`flex-1 p-0 bg-[#121212] ${adaptiveScrollbarClass}`}>
              <ul className="divide-y divide-[#333333]">
                {getActiveLogs().length === 0 ? (
                  <li className="p-8 text-center text-gray-500">No logs found for this category.</li>
                ) : (
                  getActiveLogs().map((log, index) => (
                    <li 
                      key={log._id || index} 
                      onClick={() => navigate(`/project/${log.projectId}/asset/${log._id}`)}
                      className="p-6 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-white text-lg">{log.asset}</p>
                        <p className="text-sm text-gray-400 mt-1">Project: <span className="text-gray-300">{log.project}</span></p>
                        {log.reason && (
                          <p className="text-sm text-[#ff477e] mt-2 font-medium">Feedback: {log.reason}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-300 font-medium">{log.by}</p>
                        <p className="text-xs text-gray-500 mt-1">{log.date}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ROLE-BASED DYNAMIC REPORT MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`glass-panel w-full max-w-4xl max-h-[90vh] animate-in fade-in zoom-in-95 ${adaptiveScrollbarClass}`}>
            <div className="sticky top-0 bg-[#1e1e1e] px-8 py-6 border-b border-[#333333] flex justify-between items-center z-10 shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isManager || isClient ? 'Executive Production Report' : 'Artist Performance Report'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isManager || isClient ? 'Studio Analytics, Velocity & Artist Data' : 'My Personal Metrics & History'}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary py-1.5 px-4 text-sm flex items-center gap-2"><span>📥</span> Export CSV</button>
                <button onClick={() => setIsReportOpen(false)} className="w-8 h-8 rounded-full bg-[#121212] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center">✕</button>
              </div>
            </div>
            
            <div className="p-8">
              {isManager || isClient ? (
                /* ======================= MANAGER / CLIENT VIEW ======================= */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">Team Velocity</h3>
                      <p className="text-4xl font-bold text-[#9d4edd]">92%</p>
                      <p className="text-xs text-[#10b981] mt-2">↑ 4% from last month</p>
                    </div>
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">Avg. Approval Time</h3>
                      <p className="text-4xl font-bold text-[#ffd166]">1.4d</p>
                      <p className="text-xs text-[#10b981] mt-2">↓ 0.2d from last month</p>
                    </div>
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">Studio Revision Rate</h3>
                      <p className="text-4xl font-bold text-[#ff477e]">
                        {metrics.approvedAssets + metrics.rejectedOutputs > 0 
                          ? Math.round((metrics.rejectedOutputs / (metrics.approvedAssets + metrics.rejectedOutputs)) * 100) 
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Calculated from total output</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4">Project Burn-down (30 Days)</h3>
                  <div className="w-full h-48 bg-[#121212] border border-[#333333] rounded-lg flex items-end p-4 gap-2 mb-8">
                    {[60, 40, 80, 50, 90, 70, 30, 85, 100, 45, 65, 80].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-[#9d4edd]/20 to-[#9d4edd]/80 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Bottleneck Analysis</h3>
                      <ul className="divide-y divide-[#333333] border border-[#333333] rounded-lg bg-[#121212]">
                        <li className="p-4 flex justify-between items-center">
                          <span className="text-sm text-white font-medium">Rendering Queue Backlog</span>
                          <span className="text-xs bg-[#ff477e]/20 text-[#ff477e] px-2 py-1 rounded">High Impact</span>
                        </li>
                        <li className="p-4 flex justify-between items-center">
                          <span className="text-sm text-white font-medium">Client Feedback Delays</span>
                          <span className="text-xs bg-[#ffd166]/20 text-[#ffd166] px-2 py-1 rounded">Medium</span>
                        </li>
                        <li className="p-4 flex justify-between items-center">
                          <span className="text-sm text-white font-medium">Audio Syncing Revisions</span>
                          <span className="text-xs bg-[#1e1e1e] border border-[#333333] text-gray-400 px-2 py-1 rounded">Resolved</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Top Performing Artists</h3>
                      <ul className="divide-y divide-[#333333] border border-[#333333] rounded-lg bg-[#121212]">
                        <li className="p-4 flex justify-between items-center">
                          <div>
                            <span className="text-sm text-white font-medium block">Lead Animator</span>
                            <span className="text-xs text-gray-500">12 Assets Approved this week</span>
                          </div>
                          <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">98% Approval</span>
                        </li>
                        <li className="p-4 flex justify-between items-center">
                          <div>
                            <span className="text-sm text-white font-medium block">Senior Illustrator</span>
                            <span className="text-xs text-gray-500">8 Assets Approved this week</span>
                          </div>
                          <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">95% Approval</span>
                        </li>
                        <li className="p-4 flex justify-between items-center">
                          <div>
                            <span className="text-sm text-white font-medium block">3D Generalist</span>
                            <span className="text-xs text-gray-500">5 Assets Approved this week</span>
                          </div>
                          <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">89% Approval</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                /* ======================= ARTIST VIEW ======================= */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">Active Assignments</h3>
                      <p className="text-4xl font-bold text-[#9d4edd]">{tasks.length}</p>
                      <p className="text-xs text-gray-500 mt-2">Tasks currently in progress</p>
                    </div>
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">Tasks Completed</h3>
                      <p className="text-4xl font-bold text-[#10b981]">{completedTasks.length}</p>
                      <p className="text-xs text-[#10b981] mt-2">Great work this cycle!</p>
                    </div>
                    <div className="bg-[#121212] p-6 rounded-lg border border-[#333333]">
                      <h3 className="text-sm text-gray-400 font-semibold mb-2">My First-Pass Approval</h3>
                      <p className="text-4xl font-bold text-[#ffd166]">
                        {artistStats.personalApproved + artistStats.personalRejected > 0 
                          ? Math.round((artistStats.personalApproved / (artistStats.personalApproved + artistStats.personalRejected)) * 100)
                          : 100}%
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Based on {artistStats.personalApproved + artistStats.personalRejected} total uploads</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4">My Output Velocity (Last 30 Days)</h3>
                  <div className="w-full h-48 bg-[#121212] border border-[#333333] rounded-lg flex items-end p-4 gap-2 mb-8">
                    {[10, 20, 15, 40, 60, 30, 80, 45, 90, 70, 50, 100].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-[#10b981]/20 to-[#10b981]/80 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4">Recent Areas of Excellence</h3>
                  <ul className="divide-y divide-[#333333] border border-[#333333] rounded-lg bg-[#121212]">
                    <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                      <span className="text-sm text-white font-medium">Consistent On-Time Deliveries</span>
                      <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">Top 10%</span>
                    </li>
                    <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                      <span className="text-sm text-white font-medium">Minimal Client Revisions Required</span>
                      <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">Excellent</span>
                    </li>
                    <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                      <span className="text-sm text-white font-medium">Team Collaboration & Feedback</span>
                      <span className="text-xs bg-[#9d4edd]/20 text-[#9d4edd] px-2 py-1 rounded">Highly Engaged</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;