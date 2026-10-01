import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isClient = user?.role?.includes('Reviewer') || user?.role?.includes('Client');
  const isManager = user?.role?.includes('Manager') || user?.role === 'Project Manager';
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [logModal, setLogModal] = useState({ isOpen: false, type: 'approved' });

  const [metrics] = useState({ activeProjects: 4, pendingApprovals: 7, approvedAssets: 24, rejectedOutputs: 2 });

  const [activeTasks] = useState([
    { id: 1, title: 'Nyota Walk Cycle Polish', project: 'Designer Series', deadline: 'Today, 5:00 PM', status: 'In Progress', priority: 'High', projectId: 1 },
    { id: 2, title: 'Arlecchino Combat Sequence', project: 'Promo Animation', deadline: 'Tomorrow', status: 'Review', priority: 'Urgent', projectId: 2 },
  ]);

  const [clientReviews] = useState([
    { id: 1, title: 'Arlecchino Combat Sequence', project: 'Promo Animation', deadline: 'Awaiting Feedback', status: 'Review', priority: 'Urgent', projectId: 2 },
  ]);

  const displayedTasks = isClient ? clientReviews : activeTasks;

  // Mock data for the new logs
  const approvedLogs = [
    { id: 1, asset: 'Zhongli_Burst_v2.mp4', project: 'Promo Animation', date: 'Today, 10:30 AM', by: 'Jane Director' },
    { id: 2, asset: 'Lighting_Render_Final.png', project: 'Neon Rain', date: 'Yesterday, 2:15 PM', by: 'Oceania Rep' },
    { id: 3, asset: 'Environment_Map_v4.exr', project: 'Neon Rain', date: 'Oct 28, 9:00 AM', by: 'Jane Director' },
  ];

  const rejectedLogs = [
    { id: 1, asset: 'Hirono_Concept_v1.jpg', project: 'Designer Series', date: 'Today, 9:15 AM', by: 'Jane Director', reason: 'Colors too washed out' },
    { id: 2, asset: 'Audio_Mix_v2.wav', project: 'Promo Animation', date: 'Oct 27, 4:45 PM', by: 'Oceania Rep', reason: 'Audio desync at 0:45 marker' },
  ];

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
          onClick={() => navigate('/projects')}
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
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 h-full">
            <h2 className="text-lg font-bold text-white mb-6">
              {isClient ? 'Items Awaiting My Review' : isManager ? 'Studio Active Pipeline' : 'My Active Tasks'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333333] text-gray-400">
                    <th className="pb-3 font-semibold w-1/2">Task Name</th>
                    <th className="pb-3 font-semibold">Deadline</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {displayedTasks.map(task => (
                    <tr 
                      key={task.id} 
                      onClick={() => navigate(`/project/${task.projectId}`)}
                      className="text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-4">
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.project}</p>
                      </td>
                      <td className="py-4 text-[#ff477e]">{task.deadline}</td>
                      <td className="py-4"><span className="bg-[#1e1e1e] border border-[#333333] px-2 py-1 rounded text-xs">{task.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Recent Output Activity</h2>
          <div className="space-y-4 flex-1">
            <div 
              onClick={() => navigate('/project/1')}
              className="flex gap-4 p-3 bg-[#121212] rounded-lg border border-[#333333] hover:border-[#9d4edd] transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold text-xs">REN</div>
              <div><p className="text-sm font-semibold text-white">Lighting Render</p><p className="text-xs text-gray-400 mt-1">Approved • 5h ago</p></div>
            </div>
          </div>
          <button onClick={() => setIsReportOpen(true)} className="w-full mt-6 py-2 bg-[#121212] border border-[#333333] text-white rounded-md text-sm font-semibold hover:bg-white/5 transition-colors">
            View Full Report
          </button>
        </div>
      </div>

      {/* NEW ASSET LOG MODAL */}
      {logModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="bg-[#1e1e1e] px-8 py-6 border-b border-[#333333] flex justify-between items-center shrink-0 shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {logModal.type === 'approved' ? 'Approved Assets Log' : 'Revisions & Rejections Log'}
                  <span className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider ${logModal.type === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ff477e]/20 text-[#ff477e]'}`}>
                    {logModal.type === 'approved' ? metrics.approvedAssets : metrics.rejectedOutputs} TOTAL
                  </span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Recent quality control history.</p>
              </div>
              <button onClick={() => setLogModal({ isOpen: false, type: 'approved' })} className="w-8 h-8 rounded-full bg-[#121212] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 bg-[#121212]">
              <ul className="divide-y divide-[#333333]">
                {(logModal.type === 'approved' ? approvedLogs : rejectedLogs).map((log) => (
                  <li key={log.id} className="p-6 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FULL REPORT MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="sticky top-0 bg-[#1e1e1e] px-8 py-6 border-b border-[#333333] flex justify-between items-center z-10 shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-white">Executive Production Report</h2>
                <p className="text-gray-400 text-sm">October 2026 Analytics & Velocity</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary py-1.5 px-4 text-sm flex items-center gap-2"><span>📥</span> Export CSV</button>
                <button onClick={() => setIsReportOpen(false)} className="w-8 h-8 rounded-full bg-[#121212] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center">✕</button>
              </div>
            </div>
            
            <div className="p-8">
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
                  <h3 className="text-sm text-gray-400 font-semibold mb-2">Revision Rate</h3>
                  <p className="text-4xl font-bold text-[#ff477e]">18%</p>
                  <p className="text-xs text-gray-500 mt-2">Within acceptable threshold</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Project Burn-down (30 Days)</h3>
              <div className="w-full h-48 bg-[#121212] border border-[#333333] rounded-lg flex items-end p-4 gap-2 mb-8">
                {[60, 40, 80, 50, 90, 70, 30, 85, 100, 45, 65, 80].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#9d4edd]/20 to-[#9d4edd]/80 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer" style={{ height: `${height}%` }}></div>
                ))}
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Bottleneck Analysis</h3>
              <ul className="divide-y divide-[#333333] border border-[#333333] rounded-lg bg-[#121212]">
                <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-sm text-white font-medium">Rendering Queue Backlog</span>
                  <span className="text-xs bg-[#ff477e]/20 text-[#ff477e] px-2 py-1 rounded">High Impact</span>
                </li>
                <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-sm text-white font-medium">Client Feedback Delays (Oceania)</span>
                  <span className="text-xs bg-[#ffd166]/20 text-[#ffd166] px-2 py-1 rounded">Medium Impact</span>
                </li>
                <li className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-sm text-white font-medium">Audio Syncing Revisions</span>
                  <span className="text-xs bg-[#1e1e1e] border border-[#333333] text-gray-400 px-2 py-1 rounded">Resolved</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;