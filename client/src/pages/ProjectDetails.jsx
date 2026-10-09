import { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import CreateAssetModal from "../components/CreateAssetModal";

import {
  getTasksByAssetId,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

import { getProjectById } from "../services/projectService";

import {
  getProjectAssets,
  getProjectProgress,
  approveVersion,
  rejectVersion,
} from "../services/assetService";

import { getAssetComments, createComment } from "../services/commentService";

const ProjectDetails = () => {
  const params = useParams();
  const projectId = params.projectId || params.id;
  const assetId = params.assetId;
  const location = useLocation();
  const { user } = useAuth();

  // Robust role checking
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isArtist = user?.role === "artist";
  const isClient = user?.role === "client";

  // project state
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
  
  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingLoading, setRejectingLoading] = useState(false);
  
  const [toast, setToast] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Updated task inputs
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef(null);

  // Tab Listener for Dashboard Navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "tasks" || tab === "comments") {
      setActiveTab(tab);
    }
  }, [location.search]);
  
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
        const requestedAsset = assetId
          ? loadedAssets.find((asset) => asset._id === assetId)
          : null;

        const assetToSelect = requestedAsset || loadedAssets[0];

        setSelectedAsset(assetToSelect);
        setSelectedAssetId(assetToSelect._id);
        setSelectedVersionNumber(assetToSelect.currentVersion);
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

  const loadComments = async (assetId) => {
    if (!assetId) {
      setComments([]);
      return;
    }

    try {
      setCommentsLoading(true);

      const data = await getAssetComments(assetId);

      setComments(data.comments || []);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to load feedback.",
        "error",
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(selectedAssetId);
    loadComments(selectedAssetId);
  }, [selectedAssetId]);

  useEffect(() => {
    loadProject();
  }, [projectId, assetId]);

  const selectedVersion =
    selectedAsset?.versions?.find(
      (version) => version.versionNumber === selectedVersionNumber,
    ) || null;
    
  const allTasksCompleted = tasks.every((task) => task.completed);

  // Dynamic task progress calculations
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((task) => task.completed).length;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);

  const canReviewAsset =
    (isManager || isClient) && selectedVersion?.status === "pending" && allTasksCompleted;

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);

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
    if (!selectedAssetId) {
      showNotification("Please select an asset first.", "warning");
      return;
    }

    if (!isManager && !isClient) {
      showNotification("Only managers and clients can request revisions.", "error");
      return;
    }

    setRevisionText("");
    setRevisionModalOpen(true);
  };

  const handleSubmitRevisionRequest = async (e) => {
    e.preventDefault();

    if (!revisionText.trim()) {
      showNotification("Please enter a revision request.", "warning");
      return;
    }

    if (!selectedAssetId) {
      return;
    }

    try {
      setRevisionSubmitting(true);

      const data = await createComment(
        selectedAssetId,
        revisionText.trim(),
        "revision_request",
      );

      setComments((prev) => [...prev, data.comment]);

      setRevisionText("");
      setRevisionModalOpen(false);

      setActiveTab("comments");

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);

      showNotification("Revision request submitted successfully.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to submit revision request.",
        "error",
      );
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!selectedAsset) return;
    setIsRejectModalOpen(true);
  };

  const confirmRejectAsset = async () => {
    try {
      setRejectingLoading(true);
      await rejectVersion(selectedAsset._id, selectedAsset.currentVersion);
      await loadProject();
      showNotification("Asset successfully rejected.", "success");
      setIsRejectModalOpen(false);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to reject asset.",
        "error",
      );
    } finally {
      setRejectingLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    if (!selectedAssetId) {
      showNotification("Please select an asset first.", "warning");
      return;
    }

    if (!isManager && !isClient) {
      showNotification("Only managers and clients can add feedback.", "error");
      return;
    }

    try {
      const data = await createComment(
        selectedAssetId,
        newComment.trim(),
        "comment",
      );

      setComments((prev) => [...prev, data.comment]);

      setNewComment("");

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to post feedback.",
        "error",
      );
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTaskText.trim()) {
      showNotification("Please enter a task title.", "warning");
      return;
    }

    if (!selectedAssetId) {
      showNotification("Please select an asset first.", "warning");
      return;
    }

    try {
      await createTask(selectedAssetId, {
        title: newTaskText.trim(),
        description: newTaskDescription.trim(),
        assignedTo: newTaskAssignee || null,
        deadline: newTaskDeadline || null,
      });

      setNewTaskText("");
      setNewTaskDescription("");
      setNewTaskAssignee("");
      setNewTaskDeadline("");

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

      {/* STREAMLINED HEADER */}
      <header className="bg-[#1e1e1e] border-b border-[#333333] px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div className="flex items-center gap-6">
          <Link
            to="/projects"
            className="text-gray-400 hover:text-[#9d4edd] text-sm font-medium transition-colors"
          >
            &larr; Back
          </Link>
          <div className="h-4 w-px bg-[#333333] hidden md:block"></div>

          {/* DYNAMIC TASK PROGRESS BLOCK */}
          <div className="flex items-center gap-4 bg-[#121212] border border-[#333333] px-4 py-2 rounded-xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                  Task Progress
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {taskProgress}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {completedTasksCount} of {totalTasks} tasks completed
              </p>
            </div>
            <div className="w-24 bg-[#1e1e1e] border border-[#333333] rounded-full h-2 overflow-hidden hidden sm:block">
              <div
                className="bg-gradient-to-r from-[#9d4edd] to-[#ff477e] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${taskProgress}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* CLEAN ROLE-BASED ACTIONS */}
        <div className="flex flex-wrap gap-3 items-center">
          {selectedAsset && (
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border font-mono
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
          )}

          {/* ARTIST or MANAGER/ADMIN: Allow Upload Revision & Create Asset */}
          {(isArtist || isManager) && (
            <>
              <button
                onClick={() => setIsCreateAssetModalOpen(true)}
                className="btn-primary py-1.5 px-4 text-sm shadow-lg shadow-[#9d4edd]/20 hover:shadow-[#9d4edd]/40"
              >
                + New Asset
              </button>

              {selectedAsset && (
                <button
                  onClick={() => {
                    setSelectedAssetId(selectedAsset._id);
                    setIsUploadModalOpen(true);
                  }}
                  className="btn-secondary py-1.5 px-4 text-sm"
                >
                  Upload Revision
                </button>
              )}
            </>
          )}

          {/* CLIENT / MANAGER: Review Actions */}
          {(isManager || isClient) && selectedAsset && selectedVersion?.status === "pending" && (
            <>
              <button
                onClick={handleReject}
                disabled={!allTasksCompleted}
                className={`bg-transparent border border-[#ff477e] text-[#ff477e] hover:bg-[#ff477e] hover:text-white py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !allTasksCompleted ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#ff477e]" : ""
                }`}
              >
                Reject
              </button>

              <button
                onClick={handleRequestRevision}
                disabled={!allTasksCompleted}
                className={`bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !allTasksCompleted ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#ffd166]" : ""
                }`}
              >
                Request Revision
              </button>

              <button
                onClick={handleApprove}
                disabled={!canReviewAsset}
                className={`bg-transparent border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white py-1.5 px-4 rounded-md text-sm font-bold transition-colors ${
                  !canReviewAsset ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#10b981]" : ""
                }`}
              >
                Approve
              </button>
            </>
          )}
        </div>
      </header>

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
          <div className="w-full flex-1 flex items-center justify-center flex-col gap-4">
            <p className="text-gray-400">
              No assets have been uploaded to this project yet.
            </p>
            {(isArtist || isManager) && (
              <button
                onClick={() => setIsCreateAssetModalOpen(true)}
                className="btn-primary py-2 px-6 text-sm"
              >
                + Create First Asset
              </button>
            )}
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
              Feedback & Activity
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {commentsLoading ? (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Loading activity...
                  </p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    No activity or feedback yet.
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isRevisionRequest = comment.type === "revision_request";
                    const isRevisionUpload = comment.type === "revision_upload";

                    const firstName = comment.user?.firstName || "";
                    const lastName = comment.user?.lastName || "";
                    const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";
                    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
                    const formattedTime = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "";

                    if (isRevisionRequest) {
                      return (
                        <div
                          key={comment._id}
                          className="border border-[#ffd166]/50 bg-[#ffd166]/10 rounded-lg p-4 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#ffd166] text-[#121212] flex items-center justify-center text-xs font-bold shrink-0">
                              ↻
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div>
                                  <p className="text-sm font-bold text-[#ffd166]">
                                    Revision Request
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">{fullName}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {formattedTime}
                                </span>
                              </div>
                              <p className="text-sm text-white leading-relaxed bg-[#121212]/70 border border-[#ffd166]/20 rounded-md p-3">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isRevisionUpload) {
                      return (
                        <div
                          key={comment._id}
                          className="border border-[#9d4edd]/50 bg-[#9d4edd]/10 rounded-lg p-4 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#9d4edd] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              🚀
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div>
                                  <p className="text-sm font-bold text-[#9d4edd]">
                                    Revision Upload
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">{fullName}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {formattedTime}
                                </span>
                              </div>
                              <p className="text-sm text-white leading-relaxed bg-[#121212]/70 border border-[#9d4edd]/20 rounded-md p-3">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={comment._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm text-white">{fullName}</span>
                            <span className="text-xs text-gray-400">{formattedTime}</span>
                          </div>
                          <p className="text-sm text-white leading-relaxed bg-[#121212] p-3 rounded-r-lg rounded-bl-lg border border-[#333333]">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={commentsEndRef} />
              </div>

              {isManager || isClient ? (
                <form
                  onSubmit={handlePostComment}
                  className="p-4 border-t border-[#333333] bg-[#121212]"
                >
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave feedback..."
                    className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm resize-none focus:outline-none focus:border-[#ff477e] h-24 transition-colors"
                  />

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-400">
                      Your feedback will be visible to the project team.
                    </span>

                    <button
                      type="submit"
                      className="btn-primary py-1.5 px-4 text-sm"
                    >
                      Post
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-[#333333] bg-[#121212]">
                  <p className="text-xs text-gray-500 text-center">
                    You can view activity and feedback.
                  </p>
                </div>
              )}
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
                        disabled={!isArtist && !isManager && !isAdmin}
                        className="mt-1 w-4 h-4 accent-[#9d4edd] cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${task.completed ? "text-gray-500 line-through" : "text-white"}`}>
                          {task.title}
                        </p>
                        
                        {task.description && (
                          <p className={`text-xs mt-1 ${task.completed ? "text-gray-600 line-through" : "text-gray-400"}`}>
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 bg-[#1e1e1e] text-gray-400 text-[10px] rounded border border-[#333333] uppercase font-bold tracking-wider">
                            @{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned"}
                          </span>

                          {task.deadline && (
                            <span className={`inline-block px-2 py-0.5 text-[10px] rounded border uppercase font-bold tracking-wider ${
                              new Date(task.deadline) < new Date() && !task.completed
                                ? "bg-[#ff477e]/10 text-[#ff477e] border-[#ff477e]/30"
                                : "bg-[#1e1e1e] text-gray-400 border-[#333333]"
                            }`}>
                              Deadline: {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
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
                  placeholder="Task title..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm focus:outline-none focus:border-[#ffd166] transition-colors"
                />
                
                <textarea
                  placeholder="Task description or notes (optional)..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-white border border-[#333333] rounded-md p-3 text-sm resize-none focus:outline-none focus:border-[#ffd166] transition-colors h-16"
                />

                <div className="flex gap-2">
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="flex-1 bg-[#1e1e1e] text-gray-300 border border-[#333333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#ffd166] cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="flex-1 bg-[#1e1e1e] text-white border border-[#333333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#ffd166] cursor-pointer [color-scheme:dark]"
                  />
                  
                  <button
                    type="submit"
                    className="bg-transparent border border-[#ffd166] text-[#ffd166] hover:bg-[#ffd166] hover:text-[#121212] py-2 px-4 rounded-md text-sm font-bold transition-colors"
                  >
                    Add
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

      {/* Reject Asset Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#333333]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Reject Asset Version
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  This action will mark the current version as rejected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to reject <span className="font-bold text-white">{selectedAsset?.title} (v{selectedAsset?.currentVersion})</span>? The artist will need to upload a new revision.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejectAsset}
                  disabled={rejectingLoading}
                  className="bg-[#ff477e] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#e03e6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectingLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#333333]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Request Revision
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Explain what needs to be changed before this asset can be
                  approved.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRevisionRequest} className="p-5">
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="Describe the revisions needed..."
                autoFocus
                className="w-full h-32 bg-[#121212] border border-[#333333] rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-[#ffd166]"
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={revisionSubmitting || !revisionText.trim()}
                  className="bg-[#ffd166] text-[#121212] px-4 py-2 rounded-md text-sm font-bold hover:bg-[#ffdf8a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revisionSubmitting ? "Submitting..." : "Request Revision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;