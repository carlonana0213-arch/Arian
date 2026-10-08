import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import CreateAssetModal from "../components/CreateAssetModal";

import {
  getTasksByAssetId,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import {
  addProjectMember,
  removeProjectMember,
  getProjectById,
  updateProject,
} from "../services/projectService";

import {
  getProjectAssets,
  getProjectProgress,
  approveVersion,
  rejectVersion,
} from "../services/assetService";
import { getUsers } from "../services/userService";
const ProjectDetails = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();

  //user management state
  const [users, setUsers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("artist");
  const [memberLoading, setMemberLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Robust role checking
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isArtist = user?.role === "artist";
  const isClient = user?.role === "client";

  //project state
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetLoading, setAssetLoading] = useState(true);
  const [assetError, setAssetError] = useState("");

  const [progress, setProgress] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("comments");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [toast, setToast] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef(null);

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

  const handleOpenTeamModal = async () => {
    setIsTeamModalOpen(true);

    if (isManager) {
      try {
        const response = await getUsers();
        setUsers(response.users || []);
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Failed to load users.",
          "error",
        );
      }
    }
  };
  const loadProject = async () => {
    try {
      setLoading(true);
      setAssetLoading(true);

      setError("");
      setAssetError("");

      const [projectResponse, assetResponse, progressResponse] =
        await Promise.all([
          getProjectById(projectId),
          getProjectAssets(projectId),
          getProjectProgress(projectId),
        ]);

      setProject(projectResponse.project);

      const loadedAssets = assetResponse.assets || [];

      setAssets(loadedAssets);

      if (loadedAssets.length > 0) {
        const firstAsset = loadedAssets[0];

        setSelectedAsset(firstAsset);
        setSelectedAssetId(firstAsset._id);
        setSelectedVersionNumber(firstAsset.currentVersion);
      } else {
        setSelectedAsset(null);
        setSelectedAssetId(null);
        setSelectedVersionNumber(null);
      }

      setProgress(progressResponse);
    } catch (error) {
      console.error("Failed to load project details:", error);

      setError(error.response?.data?.message || "Failed to load project.");

      setAssetError(
        error.response?.data?.message || "Failed to load project assets.",
      );
    } finally {
      setLoading(false);
      setAssetLoading(false);
    }
  };

  const loadTasks = async (assetId) => {
    if (!assetId) {
      setTasks([]);
      return;
    }

    try {
      setTasksLoading(true);

      const data = await getTasksByAssetId(assetId);

      setTasks(data.tasks || []);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to load tasks.",
        "error",
      );
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(selectedAssetId);
  }, [selectedAssetId]);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);

      await loadTasks(selectedAssetId);

      showNotification("Task deleted successfully.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to delete task.",
        "error",
      );
    }
  };

  const handleProjectStatusChange = async (newStatus) => {
    if (!project) return;

    try {
      await updateProject(project._id, {
        status: newStatus,
      });

      await loadProject();

      showNotification("Project status updated.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to update project status.",
        "error",
      );
    }
  };

  const selectedVersion =
    selectedAsset?.versions?.find(
      (version) => version.versionNumber === selectedVersionNumber,
    ) || null;
  const allTasksCompleted =
    tasks.length > 0 && tasks.every((task) => task.completed);

  const canReviewAsset =
    isManager && selectedVersion?.status === "pending" && allTasksCompleted;
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Jane Director",
      initials: "JD",
      text: "The lighting in the background looks great, but can we fix the timing on the walk cycle?",
      time: "10 mins ago",
    },
  ]);

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async () => {
    if (!selectedAsset) return;

    try {
      await approveVersion(selectedAsset._id, selectedAsset.currentVersion);

      await loadProject();

      showNotification("Asset successfully approved.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to approve asset.",
        "error",
      );
    }
  };

  const handleRequestRevision = () => {
    showNotification(
      "Revision requests will be connected to the asset review workflow.",
      "warning",
    );
  };

  const handleReject = async () => {
    showNotification(
      "Rejection comments will be connected in the review workflow.",
      "warning",
    );
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: user?.name || "Me",
        initials: (user?.name || "M").charAt(0).toUpperCase(),
        text: newComment,
        time: "Just now",
      },
    ]);
    setNewComment("");
    setTimeout(
      () => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      showNotification("Please select a user.", "warning");
      return;
    }

    try {
      setMemberLoading(true);

      await addProjectMember(projectId, selectedMemberId, selectedMemberRole);

      await loadProject();

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

      await loadProject();

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

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTaskText.trim()) {
      showNotification("Please enter a task.", "warning");
      return;
    }

    if (!selectedAssetId) {
      showNotification("Please select an asset first.", "warning");
      return;
    }

    try {
      await createTask(selectedAssetId, {
        title: newTaskText.trim(),
        assignedTo: newTaskAssignee || null,
      });

      setNewTaskText("");
      setNewTaskAssignee("");

      await loadTasks(selectedAssetId);

      showNotification("Task added successfully.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to add task.",
        "error",
      );
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await updateTask(task._id, {
        completed: !task.completed,
      });

      await loadTasks(selectedAssetId);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to update task.",
        "error",
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)] relative transition-colors duration-300">
      {/* Toast Notification */}
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

      <header className="bg-[#1e1e1e] border-b border-[#333333] px-8 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="text-gray-400 hover:text-[#9d4edd] text-sm font-medium transition-colors"
          >
            &larr; Back
          </Link>
          <div className="h-4 w-px bg-[#333333]"></div>
          {/*  <h1 className="text-xl font-bold text-white">
            {selectedAsset?.title || project?.name || "Project Details"}
          </h1>*/}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Project Status
            </p>

            <p className="text-sm text-white font-mono mt-0.5 capitalize">
              {isManager && project && (
                <select
                  value={project.status}
                  onChange={(e) => handleProjectStatusChange(e.target.value)}
                  className="bg-[#121212] text-white border border-[#333333] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#9d4edd]"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              )}
            </p>
          </div>
          <div className="w-full max-w-5xl mb-8">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  Project Progress
                  <span className="text-sm font-bold text-white">
                    {progress?.progress || 0}%
                  </span>
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {progress?.approvedAssets || 0} of{" "}
                  {progress?.totalAssets || 0} assets approved
                </p>
              </div>
            </div>

            <div className="w-full bg-[#1e1e1e] border border-[#333333] rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#9d4edd] to-[#ff477e] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress?.progress || 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border
  ${
    selectedVersion?.status === "approved"
      ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30"
      : selectedVersion?.status === "rejected"
        ? "bg-[#ff477e]/10 text-[#ff477e] border-[#ff477e]/30"
        : "bg-[#ffd166]/10 text-[#ffd166] border-[#ffd166]/30"
  }`}
          >
            {selectedVersion?.status || "pending"}
          </span>

          {(isManager || isAdmin) && (
            <button
              onClick={async () => {
                setIsTeamModalOpen(true);
                await loadUsers();
              }}
              className="btn-secondary py-1.5 px-4 text-sm mr-2 flex items-center gap-2"
            >
              <span>⚙</span> Manage Team
            </button>
          )}
          {(isManager || isArtist) && (
            <button
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              + New Asset
            </button>
          )}
          {(isArtist || isManager) && (
            <button
              onClick={() => {
                if (!selectedAsset) return;

                setSelectedAssetId(selectedAsset._id);
                setIsUploadModalOpen(true);
              }}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              Upload Revision
            </button>
          )}

          {isManager && selectedVersion?.status === "pending" && (
            <>
              <button
                onClick={handleReject}
                disabled={!allTasksCompleted}
                className={`bg-transparent border border-[#ff477e] text-[#ff477e] hover:bg-[#ff477e] hover:text-white py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !allTasksCompleted
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#ff477e]"
                    : ""
                }`}
              >
                Reject
              </button>

              <button
                onClick={handleRequestRevision}
                disabled={!allTasksCompleted}
                className={`bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !allTasksCompleted
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#ffd166]"
                    : ""
                }`}
              >
                Request Revision
              </button>

              <button
                onClick={handleApprove}
                disabled={!canReviewAsset}
                className={`bg-transparent border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !canReviewAsset
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#10b981]"
                    : ""
                }`}
              >
                Approve
              </button>
            </>
          )}
        </div>
      </header>
      {!assetLoading && assets.length > 0 && (
        <div className="w-full bg-[#1e1e1e] border-b border-[#333333] px-8 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 overflow-x-auto">
            {assets.map((asset) => (
              <button
                key={asset._id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setSelectedAssetId(asset._id);
                  setSelectedVersionNumber(asset.currentVersion);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedAsset?._id === asset._id
                    ? "bg-[#9d4edd] text-white"
                    : "bg-[#121212] text-gray-400 border border-[#333333] hover:text-white"
                }`}
              >
                {asset.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Asset View */}
        {assetLoading ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <p className="text-gray-400">Loading assets...</p>
          </div>
        ) : assetError ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <p className="text-[#ff477e]">{assetError}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <p className="text-gray-400">
              No assets have been uploaded to this project yet.
            </p>
          </div>
        ) : (
          <div className="flex-1 bg-[#121212] p-8 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-5xl aspect-video bg-[#0a0a0a] rounded-lg border border-[#333333] flex items-center justify-center relative overflow-hidden group shadow-2xl shrink-0">
              {selectedVersion?.fileUrl ? (
                <img
                  src={selectedVersion.fileUrl}
                  alt={selectedAsset?.title || "Asset preview"}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-gray-500 font-mono text-lg">
                  No asset preview available
                </span>
              )}
            </div>

            {/* Restructured Layout: Description/Metadata on Left, Version Tracker on Right */}
            <div className="w-full max-w-5xl mt-8 flex flex-col md:flex-row justify-between items-start gap-8 pb-12">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white">
                  {selectedAsset?.title || "Untitled Asset"}
                </h2>

                <p className="text-sm text-[#9d4edd] font-medium mt-1">
                  Uploaded by{" "}
                  {selectedVersion?.uploadedBy
                    ? `${selectedVersion.uploadedBy.firstName} ${selectedVersion.uploadedBy.lastName}`
                    : "Unknown"}
                  <span className="text-gray-500 font-normal">
                    {" "}
                    •{" "}
                    {selectedVersion?.uploadedAt
                      ? new Date(
                          selectedVersion.uploadedAt,
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </p>

                <div className="mt-6 mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Asset Description
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
                    {selectedAsset?.description || "No description provided."}
                  </p>
                </div>

                {/* Clean Grid Layout for Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[#1a1a1a] border border-[#333333] rounded-xl p-5 shadow-inner max-w-2xl">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Asset Type
                    </p>

                    <p className="text-sm text-white font-mono mt-0.5">
                      {selectedAsset?.assetType || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Version
                    </p>

                    <p className="text-sm text-white font-mono mt-0.5">
                      {selectedAsset?.currentVersion
                        ? `v${selectedAsset.currentVersion}`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Status
                    </p>

                    <p className="text-sm text-white font-mono mt-0.5 capitalize">
                      {selectedVersion?.status || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Versions
                    </p>

                    <p className="text-sm text-white font-mono mt-0.5">
                      {selectedAsset?.versions?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 shrink-0 flex flex-col items-start md:items-end">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                  Version History Tracker
                </p>
                <select
                  value={selectedVersionNumber || ""}
                  onChange={(e) => {
                    setSelectedVersionNumber(Number(e.target.value));
                  }}
                  className="bg-[#1e1e1e] text-white border border-[#333333] text-sm rounded-lg px-4 py-2.5 outline-none focus:border-[#ffd166] cursor-pointer w-full shadow-sm"
                >
                  {selectedAsset?.versions?.map((version) => (
                    <option
                      key={version.versionNumber}
                      value={version.versionNumber}
                    >
                      Version {version.versionNumber}
                      {version.versionNumber === selectedAsset.currentVersion
                        ? " (Current)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="w-96 bg-[#1e1e1e] border-l border-[#333333] flex flex-col z-10 shadow-xl">
          <div className="flex border-b border-[#333333]">
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "comments" ? "text-[#ffd166] border-b-2 border-[#ffd166]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("comments")}
            >
              Feedback
            </button>
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "tasks" ? "text-[#ffd166] border-b-2 border-[#ffd166]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("tasks")}
            >
              Tasks
            </button>
          </div>

          {activeTab === "comments" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {comments.map((comment) =>
                  comment.isSystem ? (
                    <div
                      key={comment.id}
                      className={`border rounded-lg p-3 flex gap-3 
                      ${
                        comment.type === "success"
                          ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
                          : comment.type === "warning"
                            ? "bg-[#ffd166]/10 border-[#ffd166]/30 text-[#ffd166]"
                            : "bg-[#ff477e]/10 border-[#ff477e]/30 text-[#ff477e]"
                      }`}
                    >
                      <span>
                        {comment.type === "success"
                          ? "✓"
                          : comment.type === "warning"
                            ? "↻"
                            : "✕"}
                      </span>
                      <p className="text-sm text-white">{comment.text}</p>
                    </div>
                  ) : (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                        {comment.initials}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm text-white">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-sm text-white leading-relaxed bg-[#121212] p-3 rounded-r-lg rounded-bl-lg border border-[#333333]">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ),
                )}
                <div ref={commentsEndRef} />
              </div>

              <form
                onSubmit={handlePostComment}
                className="p-4 border-t border-[#333333] bg-[#121212]"
              >
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave frame-accurate feedback..."
                  className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm resize-none focus:outline-none focus:border-[#ff477e] h-24 transition-colors"
                ></textarea>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">
                    Use @ to tag team members
                  </span>
                  <button
                    type="submit"
                    className="btn-primary py-1.5 px-4 text-sm"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {tasksLoading ? (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Loading tasks...
                  </p>
                ) : tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    No tasks assigned for this asset yet.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-[#121212] border border-[#333333] p-3 rounded-lg flex items-start gap-3 hover:border-[#9d4edd] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task)}
                        disabled={!isArtist}
                        className="mt-1 w-4 h-4 accent-[#9d4edd] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            task.completed
                              ? "text-gray-500 line-through"
                              : "text-white"
                          }`}
                        >
                          {task.title}
                        </p>

                        <span className="inline-block mt-2 px-2 py-0.5 bg-[#1e1e1e] text-gray-400 text-[10px] rounded border border-[#333333] uppercase font-bold tracking-wider">
                          @
                          {task.assignedTo
                            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleAddTask}
                className="p-4 border-t border-[#333333] bg-[#121212] flex flex-col gap-3"
              >
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
                    {project?.members?.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-2 px-4 rounded-md text-sm font-bold transition-colors"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        assetId={selectedAssetId}
        onUploaded={loadProject}
      />

      <CreateAssetModal
        isOpen={isCreateAssetModalOpen}
        onClose={() => setIsCreateAssetModalOpen(false)}
        projectId={projectId}
        onCreated={loadProject}
      />

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
    </div>
  );
};

export default ProjectDetails;
