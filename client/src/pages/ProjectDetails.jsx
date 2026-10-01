import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadModal from '../components/UploadModal';

const ProjectDetails = () => {
  const { id } = useParams(); 
  const { user } = useAuth();
  
  // Robust role checking
  const isClient = user?.role?.includes('Reviewer') || user?.role?.includes('Client');
  const isManager = user?.role?.includes('Manager') || user?.role === 'Project Manager';
  const isArtist = !isClient && !isManager;

  const [activeTab, setActiveTab] = useState('comments');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [toast, setToast] = useState(null);
  
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef(null);

  const [asset, setAsset] = useState({
    name: 'Zhongli_Burst_Animatic_v2.mp4',
    version: 'v2',
    status: 'Pending Review',
    uploadedBy: 'Artist A',
    uploadDate: 'Today at 10:42 AM',
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'France Sotelo', role: 'Lead Animator', email: 'france@studio.com' },
    { id: 2, name: 'Jane Director', role: 'Project Manager', email: 'jane@studio.com' },
    { id: 3, name: 'Oceania Rep', role: 'Client', email: 'review@oceania.com' },
  ]);

  const [comments, setComments] = useState([
    { id: 1, author: 'Jane Director', initials: 'JD', text: 'The lighting in the background looks great, but can we fix the timing on the walk cycle?', time: '10 mins ago' }
  ]);

  // Task Management State
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Fix timing on walk cycle', assignee: 'France', completed: false },
    { id: 2, text: 'Update background lighting', assignee: 'Artist A', completed: true }
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('France');

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = () => {
    setAsset(prev => ({ ...prev, status: 'Approved' }));
    setComments([...comments, { id: Date.now(), isSystem: true, text: `Asset was Approved by ${user?.name}`, type: 'success' }]);
    showNotification('Asset successfully approved.', 'success');
  };

  const handleRequestRevision = () => {
    setAsset(prev => ({ ...prev, status: 'Needs Revision' }));
    setComments([...comments, { id: Date.now(), isSystem: true, text: `Revision requested by ${user?.name}`, type: 'warning' }]);
    showNotification('Revision requested. Pipeline updated.', 'warning');
  };

  const handleReject = () => {
    setAsset(prev => ({ ...prev, status: 'Rejected' }));
    setComments([...comments, { id: Date.now(), isSystem: true, text: `Asset was Rejected by ${user?.name}`, type: 'error' }]);
    showNotification('Asset has been rejected.', 'error');
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { 
      id: Date.now(), 
      author: user?.name || 'Me', 
      initials: (user?.name || 'M').charAt(0).toUpperCase(), 
      text: newComment, 
      time: 'Just now' 
    }]);
    setNewComment('');
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setTeamMembers([...teamMembers, {
      id: Date.now(),
      name: newMemberEmail.split('@')[0],
      role: 'Artist / Animator',
      email: newMemberEmail
    }]);
    setNewMemberEmail('');
    showNotification(`Added ${newMemberEmail} to the project team.`);
  };

  const handleRemoveMember = (idToRemove) => {
    setTeamMembers(teamMembers.filter(member => member.id !== idToRemove));
    showNotification('Team member removed from project.');
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, assignee: newTaskAssignee, completed: false }]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)] relative transition-colors duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-4
          ${toast.type === 'success' ? 'bg-[#10b981]/90 border border-[#10b981] text-white' : 
            toast.type === 'warning' ? 'bg-[#ffd166]/90 border border-[#ffd166] text-[#121212]' : 
            'bg-[#ff477e]/90 border border-[#ff477e] text-white'}`}
        >
          <span>{toast.type === 'success' ? '✓' : toast.type === 'warning' ? '↻' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <header className="bg-[#1e1e1e] border-b border-[#333333] px-8 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="text-gray-400 hover:text-[#9d4edd] text-sm font-medium transition-colors">&larr; Back</Link>
          <div className="h-4 w-px bg-[#333333]"></div>
          <h1 className="text-xl font-bold text-white">Arlecchino Combat Sequence</h1>
          
          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border
            ${asset.status === 'Approved' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 
              asset.status === 'Needs Revision' ? 'bg-[#ffd166]/10 text-[#ffd166] border-[#ffd166]/30' : 
              asset.status === 'Rejected' ? 'bg-[#ff477e]/10 text-[#ff477e] border-[#ff477e]/30' : 
              'bg-[#9d4edd]/10 text-[#9d4edd] border-[#9d4edd]/30'}`}
          >
            {asset.status}
          </span>
        </div>

        <div className="flex gap-3 items-center">
          {isManager && (
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="btn-secondary py-1.5 px-4 text-sm mr-2 flex items-center gap-2"
            >
              <span>⚙</span> Manage Team
            </button>
          )}

          {(isArtist || isManager) && (
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-secondary py-1.5 px-4 text-sm">
              Upload Revision
            </button>
          )}
          
          {(isClient || isManager) && asset.status === 'Pending Review' && (
            <>
              <button 
                onClick={handleReject} 
                className="bg-transparent border border-[#ff477e] text-[#ff477e] hover:bg-[#ff477e] hover:text-white py-1.5 px-4 rounded-md text-sm font-bold transition-colors"
              >
                Reject
              </button>
              
              <button 
                onClick={handleRequestRevision} 
                className="bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-1.5 px-4 rounded-md text-sm font-bold transition-colors"
              >
                Request Revision
              </button>
              
              <button 
                onClick={handleApprove} 
                className="btn-primary py-1.5 px-4 text-sm bg-gradient-to-r from-[#10b981] to-green-500 shadow-none hover:shadow-lg hover:shadow-[#10b981]/20 transition-all"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Asset View */}
        <div className="flex-1 bg-[#121212] p-8 flex flex-col items-center overflow-y-auto">
          <div className="w-full max-w-5xl aspect-video bg-[#0a0a0a] rounded-lg border border-[#333333] flex items-center justify-center relative overflow-hidden group shadow-2xl shrink-0">
             <span className="text-gray-500 font-mono text-lg">Asset Preview (Video/Image Render)</span>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-1 w-full bg-gray-700 rounded-full mb-3 overflow-hidden"><div className="h-full bg-[#ff477e] w-1/3"></div></div>
              <div className="flex justify-between text-xs text-gray-300 font-mono"><span>00:01:24:12</span><span>00:03:00:00</span></div>
            </div>
          </div>

          {/* Restructured Layout: Description/Metadata on Left, Version Tracker on Right */}
          <div className="w-full max-w-5xl mt-8 flex flex-col md:flex-row justify-between items-start gap-8 pb-12">
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white">{asset.name}</h2>
              <p className="text-sm text-[#9d4edd] font-medium mt-1">Uploaded by {asset.uploadedBy} <span className="text-gray-500 font-normal">• {asset.uploadDate}</span></p>
              
              <div className="mt-6 mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asset Description</h3>
                <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
                  This iteration focuses on the heavy impact frames of the burst animation. Adjusted the particle effects during the initial cast and smoothed out the recovery frames to match the new 24fps timeline. Ensure the lighting highlights align with the updated environment maps.
                </p>
              </div>

              {/* Clean Grid Layout for Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[#1a1a1a] border border-[#333333] rounded-xl p-5 shadow-inner max-w-2xl">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Format</p>
                  <p className="text-sm text-white font-mono mt-0.5">H.264 (.mp4)</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Size</p>
                  <p className="text-sm text-white font-mono mt-0.5">45.2 MB</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Resolution</p>
                  <p className="text-sm text-white font-mono mt-0.5">1920x1080</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Frame Rate</p>
                  <p className="text-sm text-white font-mono mt-0.5">24 FPS</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64 shrink-0 flex flex-col items-start md:items-end">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Version History Tracker</p>
              <select 
                value={asset.version}
                onChange={(e) => setAsset({...asset, version: e.target.value})}
                className="bg-[#1e1e1e] text-white border border-[#333333] text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#ffd166] cursor-pointer w-full shadow-sm"
              >
                <option value="v2">Version 2 (Current)</option>
                <option value="v1">Version 1 (Rejected)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-[#1e1e1e] border-l border-[#333333] flex flex-col z-10 shadow-xl">
          <div className="flex border-b border-[#333333]">
            <button className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'text-[#ffd166] border-b-2 border-[#ffd166]' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('comments')}>Feedback</button>
            <button className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'tasks' ? 'text-[#ffd166] border-b-2 border-[#ffd166]' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('tasks')}>Tasks</button>
          </div>

          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {comments.map((comment) => (
                  comment.isSystem ? (
                    <div key={comment.id} className={`border rounded-lg p-3 flex gap-3 
                      ${comment.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 
                        comment.type === 'warning' ? 'bg-[#ffd166]/10 border-[#ffd166]/30 text-[#ffd166]' : 
                        'bg-[#ff477e]/10 border-[#ff477e]/30 text-[#ff477e]'}`}
                    >
                      <span>{comment.type === 'success' ? '✓' : comment.type === 'warning' ? '↻' : '✕'}</span>
                      <p className="text-sm text-white">{comment.text}</p>
                    </div>
                  ) : (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                        {comment.initials}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm text-white">{comment.author}</span>
                          <span className="text-xs text-gray-400">{comment.time}</span>
                        </div>
                        <p className="text-sm text-white leading-relaxed bg-[#121212] p-3 rounded-r-lg rounded-bl-lg border border-[#333333]">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  )
                ))}
                <div ref={commentsEndRef} />
              </div>

              <form onSubmit={handlePostComment} className="p-4 border-t border-[#333333] bg-[#121212]">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave frame-accurate feedback..."
                  className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm resize-none focus:outline-none focus:border-[#ff477e] h-24 transition-colors"
                ></textarea>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">Use @ to tag team members</span>
                  <button type="submit" className="btn-primary py-1.5 px-4 text-sm">Post</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-4">No tasks assigned for this asset yet.</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="bg-[#121212] border border-[#333333] p-3 rounded-lg flex items-start gap-3 hover:border-[#9d4edd] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id)} 
                        className="mt-1 w-4 h-4 accent-[#9d4edd] cursor-pointer" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {task.text}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-[#1e1e1e] text-gray-400 text-[10px] rounded border border-[#333333] uppercase font-bold tracking-wider">
                          @ {task.assignee}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleAddTask} className="p-4 border-t border-[#333333] bg-[#121212] flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Add a new task..." 
                  value={newTaskText} 
                  onChange={(e) => setNewTaskText(e.target.value)} 
                  className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm focus:outline-none focus:border-[#ffd166] transition-colors"
                />
                <div className="flex gap-2">
                  <select 
                    value={newTaskAssignee} 
                    onChange={(e) => setNewTaskAssignee(e.target.value)} 
                    className="flex-1 bg-[#1e1e1e] text-gray-300 border border-[#333333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#ffd166] cursor-pointer"
                  >
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.name.split(' ')[0]}>{m.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-2 px-4 rounded-md text-sm font-bold transition-colors">
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-colors duration-300 p-4">
          <div className="glass-panel w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-1 text-white">Manage Project Team</h2>
            <p className="text-gray-400 text-sm mb-6">Add or remove members from this production.</p>
            
            <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
              <input 
                type="email" 
                placeholder="Enter user email..."
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 bg-[#121212] border border-[#333333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#9d4edd] text-sm"
              />
              <button type="submit" className="btn-primary py-2 px-4 text-sm shrink-0">
                Invite
              </button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex justify-between items-center bg-[#121212] p-3 rounded-lg border border-[#333333]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1e1e1e] text-white flex items-center justify-center font-bold text-xs border border-[#333333]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-xs text-[#ff477e] hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-right">
              <button onClick={() => setIsTeamModalOpen(false)} className="btn-secondary py-2 px-6 text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;