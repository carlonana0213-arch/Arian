import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const getAboutText = (role) => {
    if (role?.includes('Reviewer') || role?.includes('Client')) return 'Overseeing project deliverables, providing feedback on storyboards, and approving final renders.';
    if (role?.includes('Manager')) return 'Coordinating studio pipelines, assigning tasks, and ensuring milestones are met on schedule.';
    return 'Specializing in 2D rigging, combat sequence storyboarding, and environment design.';
  };

  const getDeptText = (role) => {
    if (role?.includes('Reviewer') || role?.includes('Client')) return 'External Client';
    if (role?.includes('Manager')) return 'Production Management';
    return 'Animation Pipeline';
  };
  
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Demo User',
    email: user?.email || 'user@studio.com',
    about: getAboutText(user?.role),
    department: getDeptText(user?.role)
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        about: getAboutText(user.role),
        department: getDeptText(user.role)
      });
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const [auditLogs] = useState([
    { id: 1, action: 'SESSION_START', user: profileData.name, timestamp: '2026-10-01 08:00 AM', details: 'Successful session initialization' }
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full transition-colors duration-300">
      <div className="glass-panel overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-[#9d4edd] via-[#ff477e] to-[#ffd166] w-full relative"></div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end mb-6">
            <div className="w-32 h-32 rounded-full bg-[#121212] border-4 border-[#1e1e1e] flex items-center justify-center text-white text-5xl font-bold shadow-xl -mt-16 relative z-10 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-secondary py-2 px-6 font-medium text-sm">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white text-sm font-medium px-4 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary py-2 px-6 font-medium text-sm">
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            {isEditing ? (
              <div className="flex flex-col gap-3 max-w-sm">
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="bg-[#121212] border border-[#333333] text-white px-3 py-2 rounded text-xl font-bold focus:outline-none focus:border-[#9d4edd] transition-colors"
                />
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="bg-[#121212] border border-[#333333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#9d4edd] transition-colors"
                />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-white mb-1">{profileData.name}</h1>
                <p className="text-gray-400 font-medium mb-3">{profileData.email}</p>
              </>
            )}
            <span className="inline-block bg-[#1e1e1e] text-[#ffd166] border border-[#333333] px-3 py-1 mt-3 rounded-md text-xs font-bold uppercase tracking-wider shadow-inner">
              {user?.role || 'Artist / Animator'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-8 border-t border-[#333333]">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">About Me</h3>
              {isEditing ? (
                <textarea 
                  value={profileData.about}
                  onChange={(e) => setProfileData({...profileData, about: e.target.value})}
                  className="w-full h-32 bg-[#121212] border border-[#333333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#9d4edd] resize-none mb-6 transition-colors"
                />
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{profileData.about}</p>
              )}
              
              <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-[#333333] pb-2">
                  <span className="text-gray-400">Timezone</span>
                  <span className="text-white font-medium">PHT (GMT+8)</span>
                </li>
                <li className="flex justify-between border-b border-[#333333] pb-2 items-center">
                  <span className="text-gray-400">Department</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.department}
                      onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                      className="bg-[#121212] border border-[#333333] text-white px-2 py-1 rounded text-right w-1/2 text-sm focus:outline-none focus:border-[#9d4edd] transition-colors"
                    />
                  ) : (
                    <span className="text-white font-medium">{profileData.department}</span>
                  )}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Recent Studio Activity</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#121212] border border-[#333333] flex items-center justify-center text-lg shrink-0">
                    {user?.role?.includes('Reviewer') ? '👁️' : user?.role?.includes('Manager') ? '📋' : '🎬'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {user?.role?.includes('Reviewer') ? 'Reviewed final render' : user?.role?.includes('Manager') ? 'Assigned new task' : 'Uploaded new animatic version'}
                    </p>
                    <p className="text-xs text-gray-400">Zhongli_Burst_v2.mp4 • 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#333333]">
            <h3 className="text-lg font-bold text-white mb-6">System Audit Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#333333] text-gray-400">
                    <th className="pb-3 font-semibold w-1/4">Action</th>
                    <th className="pb-3 font-semibold w-1/4">Timestamp</th>
                    <th className="pb-3 font-semibold w-1/2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="text-white hover:bg-white/5 transition-colors cursor-pointer">
                      <td className="py-4 font-mono text-xs text-[#ff477e]">{log.action}</td>
                      <td className="py-4 text-gray-400 text-xs">{log.timestamp}</td>
                      <td className="py-4">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;