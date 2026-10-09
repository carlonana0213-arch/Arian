import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectAssets, deleteAsset } from "../services/assetService";
import CreateAssetModal from "../components/CreateAssetModal";
import AssetCard from "../components/AssetCard";
import { getUsers } from "../services/userService";
import {
  addProjectMember,
  removeProjectMember,
  getProjectById,
} from "../services/projectService";

const ProjectAssets = () => {
  const params = useParams();
  const projectId = params.projectId || params.id;
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
    if (!projectId) return;
    try {
      setLoading(true);
      setError("");

      const [projectResponse, assetResponse] = await Promise.all([
        getProjectById(projectId),
        getProjectAssets(projectId),
      ]);

      setProject(projectResponse.project || projectResponse);
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

  const handleDeleteAsset = async (assetId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this asset and all of its versions?",
    );

    if (!confirmed) return;

    try {
      setDeletingAssetId(assetId);
      await deleteAsset(assetId);
      await loadPage();
      showNotification("Asset deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete asset:", error);
      showNotification(error.response?.data?.message || "Failed to delete asset.", "error");
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full text-center text-gray-400">
        <p>Loading assets workspace...</p>
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
          className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-4 ${
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
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Projects
          </Link>

          <h1 className="text-3xl font-bold text-white mt-4">
            {project?.name || "Project Workspace"}
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            {project?.description || "Manage and review project assets."}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {(isManager || isAdmin) && (
            <button
              type="button"
              onClick={async () => {
                setIsTeamModalOpen(true);
                await loadUsers();
              }}
              className="btn-secondary py-2 px-6 flex items-center gap-2"
            >
              <span>⚙</span> Manage Team
            </button>
          )}
          {canManageAssets && (
            <button
              type="button"
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary py-2 px-6"
            >
              + Add Asset
            </button>
          )}
        </div>
      </header>

      {assets.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <h2 className="text-xl font-semibold text-white">No assets yet</h2>

          <p className="text-sm text-gray-500 mt-2">
            This project does not have any assets uploaded yet.
          </p>

          {canManageAssets && (
            <button
              type="button"
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary mt-6 px-6 py-2.5"
            >
              + Add First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              projectId={projectId}
              navigate={navigate}
              onUpdated={loadPage}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      )}

      {/* MANAGE TEAM MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-colors duration-300 p-4">
          <div className="glass-panel w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
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
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {project.members.map((member) => (
                    <div
                      key={member.user?._id || member.user}
                      className="flex items-center justify-between bg-[#121212] border border-[#333333] rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {member.user?.firstName} {member.user?.lastName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {member.user?.email || "Team Collaborator"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 capitalize bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#333333]">
                          {member.role}
                        </span>

                        {(member.user?._id || member.user) !== (project.manager?._id || project.manager) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.user?._id || member.user)}
                            disabled={memberLoading}
                            className="text-xs text-[#ff477e] hover:text-white transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">
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
                      className="w-full bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="">Select user</option>

                      {users
                        .filter(
                          (candidate) =>
                            !project?.members?.some(
                              (member) =>
                                (member.user?._id || member.user) === candidate._id,
                            ),
                        )
                        .map((candidate) => (
                          <option key={candidate._id} value={candidate._id}>
                            {candidate.firstName} {candidate.lastName} — {candidate.role}
                          </option>
                        ))}
                    </select>

                    <select
                      value={selectedMemberRole}
                      onChange={(e) => setSelectedMemberRole(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="artist">Artist</option>
                      <option value="manager">Manager</option>
                      <option value="client">Client</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={memberLoading || !selectedMemberId}
                      className="btn-primary w-full py-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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