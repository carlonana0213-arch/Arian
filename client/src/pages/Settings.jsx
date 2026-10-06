import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 max-w-3xl mx-auto w-full transition-colors duration-300">
      <h1 className="text-3xl font-bold text-white mb-8">Studio Settings</h1>
      
      <div className="glass-panel p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Appearance</h3>
          <p className="text-sm text-gray-400 mb-4">Customize your UI theme.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => toggleTheme('dark')}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#1e1e1e] border border-[#9d4edd] text-white shadow-inner' 
                  : 'bg-[#121212] border border-[#333333] text-gray-500 hover:text-gray-300'
              }`}
            >
              Dark Mode
            </button>
            <button 
              onClick={() => toggleTheme('light')}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                theme === 'light' 
                  ? 'bg-[#1e1e1e] border border-[#9d4edd] text-white shadow-inner' 
                  : 'bg-[#121212] border border-[#333333] text-gray-500 hover:text-gray-300'
              }`}
            >
              Light Mode
            </button>
          </div>
        </div>

        <div className="border-t border-[#333333] pt-8">
          <h3 className="text-lg font-bold text-white mb-2">Email Notifications</h3>
          <div className="space-y-3 mt-4">
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#ff477e] w-4 h-4" />
              Email me when an asset is approved
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#ff477e] w-4 h-4" />
              Email me when a revision is requested
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" className="accent-[#ff477e] w-4 h-4" />
              Daily project digest
            </label>
          </div>
        </div>

        <div className="border-t border-[#333333] pt-8">
          <h3 className="text-lg font-bold text-white mb-2">Integrations & Webhooks</h3>
          <p className="text-sm text-gray-400 mb-6">Connect AnimTrackr events to external team communication tools.</p>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discord Webhook URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://discord.com/api/webhooks/..." 
                  className="flex-1 bg-[#121212] border border-[#333333] text-white px-4 py-2 rounded focus:outline-none focus:border-[#9d4edd] text-sm"
                />
                <button className="btn-secondary px-4 py-2 text-sm font-semibold">Test</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slack Webhook URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://hooks.slack.com/services/..." 
                  className="flex-1 bg-[#121212] border border-[#333333] text-white px-4 py-2 rounded focus:outline-none focus:border-[#9d4edd] text-sm"
                />
                <button className="btn-secondary px-4 py-2 text-sm font-semibold">Test</button>
              </div>
            </div>
          </div>
          
          <button className="btn-primary mt-6 py-2 px-6 text-sm">Save Integrations</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;