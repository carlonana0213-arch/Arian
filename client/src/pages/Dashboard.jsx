import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  const isClient = user?.role?.includes('Reviewer') || user?.role?.includes('Client');
  const isManager = user?.role?.includes('Manager');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [metrics] = useState({ activeProjects: 4, pendingApprovals: 7, approvedAssets: 24, rejectedOutputs: 2 });

  const [activeTasks] = useState([
    { id: 1, title: 'Nyota Walk Cycle Polish', project: 'Designer Series', deadline: 'Today, 5:00 PM', status: 'In Progress', priority: 'High' },
    { id: 2, title: 'Arlecchino Combat Sequence', project: 'Promo Animation', deadline: 'Tomorrow', status: 'Review', priority: 'Urgent' },
  ]);

  const [clientReviews] = useState([
    { id: 1, title: 'Arlecchino Combat Sequence', project: 'Promo Animation', deadline: 'Awaiting Feedback', status: 'Review', priority: 'Urgent' },
  ]);

  const displayedTasks = isClient ? clientReviews : activeTasks;

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
        <div className="glass-panel p-5 border-l-4 border-l-[#9d4edd]">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-white">{metrics.activeProjects}</p>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-[#ffd166]">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-white">{metrics.pendingApprovals}</p>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-[#10b981]">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Approved Assets</p>
          <p className="text-3xl font-bold text-white">{metrics.approvedAssets}</p>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-[#ff477e]">
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
                    <tr key={task.id} className="text-white hover:bg-white/5 transition-colors cursor-pointer">
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
            <div className="flex gap-4 p-3 bg-[#121212] rounded-lg border border-[#333333] hover:border-[#9d4edd] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold text-xs">REN</div>
              <div><p className="text-sm font-semibold text-white">Lighting Render</p><p className="text-xs text-gray-400 mt-1">Approved • 5h ago</p></div>
            </div>
          </div>
          <button onClick={() => setIsReportOpen(true)} className="w-full mt-6 py-2 bg-[#121212] border border-[#333333] text-white rounded-md text-sm font-semibold hover:bg-white/5 transition-colors">
            View Full Report
          </button>
        </div>
      </div>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* THE FIX IS HERE: Changed bg-[#1e1e1e]/95 backdrop-blur to solid bg-[#1e1e1e] */}
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