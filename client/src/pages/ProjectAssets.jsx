import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectAssets, deleteAsset } from "../services/assetService";
import CreateAssetModal from "../components/CreateAssetModal";
import { getUsers } from "../services/userService";
import {
  addProjectMember,
  removeProjectMember,
  getProjectById,
  updateProject,
} from "../services/projectService";

import api from "../services/api";

const ProjectAssets = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isArtist = user?.role === "artist";

  const canManageAssets = isManager || isArtist;
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("artist");
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);

      const data = await getUsers();

      setUsers(data.users || []);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to load users.",
        "error",
      );
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      showNotification("Please select a user.", "warning");
      return;
    }

    try {
      setMemberLoading(true);

      await addProjectMember(projectId, selectedMemberId, selectedMemberRole);

      await loadPage();

      setSelectedMemberId("");

      showNotification("Team member added successfully.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to add team member.",
        "error",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setMemberLoading(true);

      await removeProjectMember(projectId, userId);

      await loadPage();

      showNotification("Team member removed.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to remove team member.",
        "error",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [projectResponse, assetResponse] = await Promise.all([
        getProjectById(projectId),
        getProjectAssets(projectId),
      ]);

      setProject(projectResponse.project);
      setAssets(assetResponse.assets || []);
    } catch (error) {
      console.error("Failed to load project assets:", error);

      setError(
        error.response?.data?.message || "Failed to load project assets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [projectId]);

  const getTaskStats = async (assetId) => {
    try {
      const response = await api.get(`/tasks/asset/${assetId}`);

      const tasks = response.data.tasks || [];

      const total = tasks.length;
      const completed = tasks.filter((task) => task.completed).length;

      const percentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        total,
        completed,
        percentage,
      };
    } catch (error) {
      console.error(`Failed to load tasks for asset ${assetId}:`, error);

      return {
        total: 0,
        completed: 0,
        percentage: 0,
      };
    }
  };

  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    const loadTaskStats = async () => {
      if (!assets.length) {
        setTaskStats({});
        return;
      }

      const entries = await Promise.all(
        assets.map(async (asset) => {
          const stats = await getTaskStats(asset._id);

          return [asset._id, stats];
        }),
      );

      setTaskStats(Object.fromEntries(entries));
    };

    loadTaskStats();
  }, [assets]);

  const handleDeleteAsset = async (assetId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this asset and all of its versions?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAssetId(assetId);

      await deleteAsset(assetId);

      await loadPage();
    } catch (error) {
      console.error("Failed to delete asset:", error);

      setError(error.response?.data?.message || "Failed to delete asset.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <p className="text-gray-400">Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <p className="text-[#ff477e]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {toast && (
        <div
          className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-4
        ${
          toast.type === "success"
            ? "bg-[#10b981]/90 border border-[#10b981] text-white"
            : toast.type === "warning"
              ? "bg-[#ffd166]/90 border border-[#ffd166] text-[#121212]"
              : "bg-[#ff477e]/90 border border-[#ff477e] text-white"
        }`}
        >
          <span>
            {toast.type === "success"
              ? "✓"
              : toast.type === "warning"
                ? "↻"
                : "✕"}
          </span>

          {toast.message}
        </div>
      )}
      <header className="flex justify-between items-start mb-8 pb-6 border-b border-[#333333]">
        <div>
          <Link
            to="/projects"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to Projects
          </Link>

          <h1 className="text-3xl font-bold text-white mt-4">
            {project?.name || "Project"}
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            Manage and review project assets.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {(isManager || isAdmin) && (
            <button
              onClick={async () => {
                setIsTeamModalOpen(true);
                await loadUsers();
              }}
              className="btn-secondary py-2 px-6 "
            >
              <span>⚙</span> Manage Team
            </button>
          )}
          {canManageAssets && (
            <button
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary py-2 px-6"
            >
              + Add Asset
            </button>
          )}
        </div>
      </header>

      {assets.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <h2 className="text-xl font-semibold text-white">No assets yet</h2>

          <p className="text-sm text-gray-500 mt-2">
            This project does not have any assets yet.
          </p>

          {canManageAssets && (
            <button
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary mt-6 px-6 py-2"
            >
              + Add First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const stats = taskStats[asset._id] || {
              total: 0,
              completed: 0,
              percentage: 0,
            };

            const currentVersion = asset.versions?.find(
              (version) => version.versionNumber === asset.currentVersion,
            );

            return (
              <div
                key={asset._id}
                className="glass-panel overflow-hidden group hover:border-[#9d4edd] transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/project/${projectId}/asset/${asset._id}`)
                  }
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
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-lg font-bold text-white group-hover:text-[#9d4edd] transition-colors">
                        {asset.title}
                      </h2>

                      <span className="text-xs px-2 py-1 rounded bg-[#121212] border border-[#333333] text-gray-400 whitespace-nowrap">
                        v{asset.currentVersion}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {asset.assetType}
                    </p>

                    <div className="mt-6">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Tasks</span>

                        <span className="text-white font-mono">
                          {stats.completed} / {stats.total}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-[#121212] border border-[#333333] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9d4edd] to-[#ff477e] transition-all duration-500"
                          style={{
                            width: `${stats.percentage}%`,
                          }}
                        />
                      </div>

                      <div className="text-right mt-2 text-xs text-gray-500">
                        {stats.percentage}% complete
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#333333] flex justify-between">
                      <span className="text-xs text-gray-500">
                        Current Version
                      </span>

                      <span className="text-xs text-white font-mono">
                        v{asset.currentVersion}
                      </span>
                    </div>
                  </div>
                </button>

                {isManager && (
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset._id)}
                      disabled={deletingAssetId === asset._id}
                      className="w-full py-2 text-xs font-semibold border border-[#ff477e] text-[#ff477e] rounded-md hover:bg-[#ff477e] hover:text-white transition-colors disabled:opacity-50"
                    >
                      {deletingAssetId === asset._id
                        ? "Deleting..."
                        : "Remove Asset"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-colors duration-300 p-4">
          <div className="glass-panel w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-1 text-white">
              Manage Project Team
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Add or remove members from this production.
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Current Team</h3>

              {project?.members?.length ? (
                project.members.map((member) => (
                  <div
                    key={member.user?._id}
                    className="flex items-center justify-between bg-[#121212] border border-[#333333] rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>

                      <p className="text-xs text-gray-500">
                        {member.user?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 capitalize">
                        {member.role}
                      </span>

                      {member.user?._id !== project.manager?._id && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.user._id)}
                          disabled={memberLoading}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No team members assigned.
                </p>
              )}
              <div className="mt-6 pt-6 border-t border-[#333333]">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Add Team Member
                </h3>

                {usersLoading ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd]"
                    >
                      <option value="">Select user</option>

                      {users
                        .filter(
                          (user) =>
                            !project?.members?.some(
                              (member) => member.user?._id === user._id,
                            ),
                        )
                        .map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} — {user.role}
                          </option>
                        ))}
                    </select>

                    <select
                      value={selectedMemberRole}
                      onChange={(e) => setSelectedMemberRole(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd]"
                    >
                      <option value="artist">Artist</option>
                      <option value="manager">Manager</option>
                      <option value="client">Client</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={memberLoading || !selectedMemberId}
                      className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {memberLoading ? "Adding..." : "Add Member"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <CreateAssetModal
        isOpen={isCreateAssetModalOpen}
        onClose={() => setIsCreateAssetModalOpen(false)}
        projectId={projectId}
        onCreated={loadPage}
      />
    </div>
  );
};

export default ProjectAssets;
