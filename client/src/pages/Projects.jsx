import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ROLE CHECKS
  const isClient = user?.role?.includes('Reviewer') || user?.role?.includes('Client');
  const isManager = user?.role?.includes('Manager') || user?.role === 'Project Manager';
  
  const [projects, setProjects] = useState([
    { id: 1, title: 'Sci-Fi Short: "Neon Rain"', client: 'Internal', status: 'In Production', lastActive: '2 hours ago', progress: 65, priority: 'High' },
    { id: 2, title: 'Summer Campaign Ad', client: 'Oceania Brands', status: 'Pending Review', lastActive: '1 day ago', progress: 90, priority: 'Urgent' },
    { id: 3, title: 'Character Rigging Tests', client: 'R&D', status: 'Planning', lastActive: '3 days ago', progress: 15, priority: 'Normal' },
  ]);

  const [newProject, setNewProject] = useState({ 
    title: '', client: '', description: '', deadline: '', priority: 'Normal', lead: '', status: 'Planning' 
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    const projectToAdd = {
      id: projects.length + 1,
      title: newProject.title,
      client: newProject.client,
      status: newProject.status,
      priority: newProject.priority,
      lastActive: 'Just now',
      progress: 0
    };
    setProjects([projectToAdd, ...projects]);
    setIsModalOpen(false);
    setNewProject({ title: '', client: '', description: '', deadline: '', priority: 'Normal', lead: '', status: 'Planning' });
  };

  const handleStatusChange = (e, projectId) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, status: e.target.value } : p
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#333333]">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-2 text-sm">Manage and track all studio productions.</p>
        </div>
        {!isClient && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-6 shadow-lg shadow-[#9d4edd]/20 hover:shadow-[#9d4edd]/40">+ New Project</button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/project/${project.id}`} className="glass-panel p-6 hover:border-[#9d4edd] transition-all duration-300 group block no-underline flex flex-col h-full hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9d4edd]">{project.client}</span>
              
              {/* RESTRICTED STATUS TOGGLE */}
              {isManager ? (
                <div className="relative">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e, project.id)}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="text-xs px-3 py-1 rounded font-medium bg-[#1e1e1e] border border-[#333333] text-gray-400 focus:outline-none focus:border-[#ffd166] cursor-pointer appearance-none hover:bg-white/5 transition-colors pr-6 shadow-sm relative z-20"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Production">In Production</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[8px]">
                    ▼
                  </div>
                </div>
              ) : (
                <span className="text-xs px-3 py-1 rounded font-medium bg-[#1e1e1e] border border-[#333333] text-gray-400">
                  {project.status}
                </span>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#9d4edd] transition-colors">{project.title}</h2>
            
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full ${project.priority === 'Urgent' ? 'bg-[#ff477e]' : project.priority === 'High' ? 'bg-[#ffd166]' : 'bg-gray-400'}`}></span>
              <span className="text-xs text-gray-400">{project.priority} Priority • Last updated {project.lastActive}</span>
            </div>
            
            <div className="mt-auto">
              <div className="w-full bg-[#121212] rounded-full h-1.5 mb-2 overflow-hidden border border-[#333333]">
                <div className="bg-gradient-to-r from-[#9d4edd] to-[#ff477e] h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
              </div>
              <div className="text-right text-xs text-gray-400 font-mono">{project.progress}% Completed</div>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white text-xl transition-colors">✕</button>
            <h2 className="text-2xl font-bold mb-1 text-white">Initialize New Project</h2>
            <p className="text-gray-400 text-sm mb-8">Set up the foundation for a new production pipeline.</p>
            
            <form onSubmit={handleCreateProject} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Title</label>
                <input type="text" required value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm transition-colors" placeholder="e.g., Q3 Marketing Campaign" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Description</label>
                <textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm h-24 resize-none transition-colors" placeholder="Brief overview of deliverables..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client / Department</label>
                  <input type="text" required value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Deadline</label>
                  <input type="date" required value={newProject.deadline} onChange={(e) => setNewProject({...newProject, deadline: e.target.value})} className="bg-[#121212] border border-[#333333] text-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm [color-scheme:dark] transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority Level</label>
                  <select value={newProject.priority} onChange={(e) => setNewProject({...newProject, priority: e.target.value})} className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm transition-colors">
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Assignee / PM</label>
                  <input type="text" placeholder="e.g., jane@studio.com" value={newProject.lead} onChange={(e) => setNewProject({...newProject, lead: e.target.value})} className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm transition-colors" />
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Thumbnail (Optional)</label>
                <div className="border-2 border-dashed border-[#333333] hover:border-[#9d4edd] bg-[#121212]/50 hover:bg-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">🖼️</div>
                  <p className="text-sm font-semibold text-white">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#333333]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-medium px-4 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary py-2.5 px-8 font-bold">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;