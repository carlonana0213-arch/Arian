import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const AssetCard = ({ asset, onUpdated, onDelete, navigate, projectId }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(asset.title || "");
  const [editDescription, setEditDescription] = useState(asset.description || "");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // Task Stats State
  const [tasks, setTasks] = useState([]);

  const currentVersion = asset.versions?.find(
    (version) => version.versionNumber === asset.currentVersion,
  );

  const isManager = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get(`/tasks/asset/${asset._id}`);
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks for asset UI:", err);
      }
    };

    if (asset._id) {
      fetchTasks();
    }
  }, [asset._id]);

  const handleUpdateAssetInfo = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      setUpdating(true);
      setError("");
      await api.patch(`/assets/${asset._id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setIsEditModalOpen(false);
      await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update asset.");
    } finally {
      setUpdating(false);
    }
  };

  const truncateDescription = (text, maxLength = 65) => {
    if (!text) return "No description provided.";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Calculate dynamic task progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const percentComplete = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <>
      <div className="glass-panel overflow-hidden group hover:border-[#9d4edd] transition-all duration-300 flex flex-col h-full relative">
        
        {/* 1. IMAGE PREVIEW ON TOP */}
        <button
          type="button"
          onClick={() => navigate(`/project/${projectId}/asset/${asset._id}`)}
          className="w-full text-left"
        >
          <div className="aspect-video bg-[#121212] overflow-hidden">
            {currentVersion?.fileUrl ? (
              <img
                src={currentVersion.fileUrl}
                alt={asset.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                No preview
              </div>
            )}
          </div>
        </button>

        {/* 2. BODY CONTENT */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Title, Type, Version Badge & Kebab Menu */}
            <div className="flex justify-between items-start mb-4">
              <button
                type="button"
                onClick={() => navigate(`/project/${projectId}/asset/${asset._id}`)}
                className="text-left flex-1 pr-2"
              >
                <h2 className="text-lg font-bold text-white group-hover:text-[#9d4edd] transition-colors truncate">
                  {asset.title}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {asset.assetType}
                </p>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-[#121212] border border-[#333333] text-gray-400 whitespace-nowrap font-mono">
                  v{asset.currentVersion}
                </span>

                {isManager && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                      ⋮
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 top-8 w-36 bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl py-1.5 z-30">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setEditTitle(asset.title || "");
                            setEditDescription(asset.description || "");
                            setIsEditModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <span>✏️</span> Edit Asset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onDelete?.(asset._id);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-[#ff477e] hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <span>🗑️</span> Remove Asset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SINGLE CLEAN DIVIDER */}
            <div className="h-px bg-[#333333] mb-4" />

            {/* Task Stats Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Tasks</span>
                <span className="text-white font-mono">{completedTasks} / {totalTasks}</span>
              </div>
              <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#9d4edd] to-[#ff477e] transition-all duration-500" 
                  style={{ width: `${percentComplete}%` }} 
                />
              </div>
              <div className="text-right mt-1 text-[10px] text-gray-500 font-mono">
                {percentComplete}% complete
              </div>
            </div>

            {/* Current Version Row */}
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>Current Version</span>
              <span className="text-white font-mono">v{asset.currentVersion}</span>
            </div>
          </div>

          {/* DESCRIPTION AT THE BOTTOM */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 h-8 line-clamp-2 overflow-hidden leading-relaxed">
              {truncateDescription(asset.description)}
            </p>
          </div>
        </div>
      </div>

      {/* EDIT ASSET MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Edit Asset Details</h2>
            <p className="text-gray-400 text-xs mb-6">Update asset title and description.</p>

            <form onSubmit={handleUpdateAssetInfo} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asset Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full mt-1 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full mt-1 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm h-24 resize-none"
                  placeholder="Asset description..."
                />
              </div>

              {error && <p className="text-xs text-[#ff477e]">{error}</p>}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs font-medium px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary py-2 px-6 text-xs font-bold disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AssetCard;