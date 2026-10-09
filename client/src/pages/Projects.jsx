import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  updateProject,
} from "../services/projectService";
import { getProjectAssets } from "../services/assetService";
import { getUsers } from "../services/userService";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("artist");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Panel toggle states
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Edit State
  const [editingProject, setEditingProject] = useState({
    id: "",
    title: "",
    client: "",
    description: "",
    deadline: "",
    priority: "Normal",
    status: "planning",
    members: [],
  });

  // ROLE CHECKS
  const isClient = user?.role === "client";
  const isManager =
    user?.role?.includes("manager") ||
    user?.role === "manager" ||
    user?.role === "admin";

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();
      const loadedProjects = data.projects || [];

      // Fetch assets for each project to dynamically calculate approved progress
      const projectsWithProgress = await Promise.all(
        loadedProjects.map(async (project) => {
          try {
            const assetData = await getProjectAssets(project._id);
            const projectAssets = assetData.assets || [];
            
            const totalAssets = projectAssets.length;
            const approvedAssets = projectAssets.filter(asset => {
              const currentVersion = asset.versions?.find(
                (v) => v.versionNumber === asset.currentVersion
              );
              return currentVersion?.status === "approved";
            }).length;

            const progress = totalAssets === 0 ? 0 : Math.round((approvedAssets / totalAssets) * 100);

            return {
              ...project,
              progressData: {
                progress,
                totalAssets,
                approvedAssets,
              },
            };
          } catch (error) {
            console.error(
              `Failed to load assets/progress for project ${project._id}:`,
              error,
            );
            return {
              ...project,
              progressData: {
                progress: 0,
                totalAssets: 0,
                approvedAssets: 0,
              },
            };
          }
        }),
      );

      setProjects(projectsWithProgress);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const [newProject, setNewProject] = useState({
    title: "",
    client: "",
    description: "",
    deadline: "",
    priority: "Normal",
    lead: "",
    status: "planning",
  });

  const handleCreateProject = async (e) => {
    e.preventDefault();

    try {
      setError("");

      await createProject({
        name: newProject.title,
        description: newProject.description,
        deadline: newProject.deadline,
        priority: isManager ? newProject.priority : "Normal",
        status: newProject.status || "planning",
        client: selectedClientId || undefined,
        members: selectedMembers,
      });

      await loadProjects();
      setIsModalOpen(false);

      setSelectedClientId("");
      setSelectedMemberId("");
      setSelectedMemberRole("artist");
      setSelectedMembers([]);

      setNewProject({
        title: "",
        client: "",
        description: "",
        deadline: "",
        priority: "Normal",
        lead: "",
        status: "planning",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create project.");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();

    try {
      setError("");

      await updateProject(editingProject.id, {
        name: editingProject.title,
        description: editingProject.description,
        deadline: editingProject.deadline,
        priority: isManager ? editingProject.priority : "Normal",
        status: editingProject.status,
        client: editingProject.client || undefined,
        members: editingProject.members,
      });

      await loadProjects();
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update project.");
    }
  };

  const handleStatusChange = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();

    const newStatus = e.target.value;

    try {
      setError("");
      await updateProject(projectId, {
        status: newStatus,
      });
      await loadProjects();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update project status.",
      );
    }
  };

  // Priority color badge helper with Normal included
  const getPriorityBadgeStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-[#ff477e]/20 text-[#ff477e] border-[#ff477e]/30';
      case 'high':
        return 'bg-[#ffd166]/20 text-[#ffd166] border-[#ffd166]/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'normal':
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Filter Projects into Active, Completed, and Archived
  const activeProjects = projects.filter(
    (p) => p.status !== "archived" && p.status !== "completed"
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  return (
    <div className="p-8 max-w-7xl mx-auto w-full transition-colors duration-300" onClick={() => setActiveMenuId(null)}>
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#333333]">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Manage and track all studio productions.
          </p>
        </div>
        {!isClient && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              await loadUsers();
            }}
            className="btn-primary py-2 px-6 shadow-lg shadow-[#9d4edd]/20 hover:shadow-[#9d4edd]/40"
          >
            + New Project
          </button>
        )}
      </header>

      {/* ACTIVE PROJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {activeProjects.map((project) => (
          <div
            key={project._id}
            className="glass-panel p-6 hover:border-[#9d4edd] transition-all duration-300 group flex flex-col h-full relative"
          >
            {/* Invisible full-card overlay link prevents text-selection/highlight bugs */}
            <Link to={`/project/${project._id}`} className="absolute inset-0 z-0 rounded-xl" />

            {/* CARD TOP BAR: Client & Kebab Menu */}
            <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9d4edd]">
                {project.client
                  ? `${project.client.firstName} ${project.client.lastName}`
                  : "No Client Assigned"}
              </span>

              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Priority Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${getPriorityBadgeStyle(project.priority)} pointer-events-none`}>
                  {project.priority || 'Normal'}
                </span>

                {/* Manager Kebab */}
                {isManager && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveMenuId(activeMenuId === project._id ? null : project._id);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#333333] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                      ⋮
                    </button>

                    {/* Kebab Dropdown Menu */}
                    {activeMenuId === project._id && (
                      <div className="absolute right-0 top-9 w-40 bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl py-2 z-30 animate-in fade-in duration-150">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveMenuId(null);
                            
                            // Map existing members for editing format
                            const formattedMembers = (project.members || []).map(m => ({
                              user: m.user?._id || m.user,
                              role: m.role || 'artist'
                            }));

                            setEditingProject({
                              id: project._id,
                              title: project.name || "",
                              client: project.client?._id || "",
                              description: project.description || "",
                              deadline: project.deadline ? project.deadline.substring(0, 10) : "",
                              priority: project.priority || "Normal",
                              status: project.status || "planning",
                              members: formattedMembers,
                            });
                            await loadUsers();
                            setIsEditModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <span>✏️</span> Edit Project
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CARD BODY CONTENT */}
            <div className="flex-1 flex flex-col relative z-10 pointer-events-none">
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#9d4edd] transition-colors">
                {project.name}
              </h2>

              <p className="text-xs text-gray-400 line-clamp-2 mb-6">
                {project.description || "No description provided."}
              </p>

              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#9d4edd]"></span>
                <span className="text-xs text-gray-400">
                  Created{" "}
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>

            {/* STATUS & PROGRESS BAR */}
            <div className="mt-auto pt-4 border-t border-[#333333]/50 flex flex-col gap-3 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 pointer-events-none">Status</span>
                {isManager ? (
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e, project._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-2.5 py-1 rounded font-medium bg-[#1e1e1e] border border-[#333333] text-gray-300 focus:outline-none focus:border-[#ffd166] cursor-pointer pointer-events-auto"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">In Production</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded font-medium bg-[#1e1e1e] border border-[#333333] text-gray-300 capitalize pointer-events-none">
                    {project.status}
                  </span>
                )}
              </div>

              <div className="pointer-events-none">
                <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                  <span className="text-gray-400 uppercase tracking-wider font-bold">Approved Assets</span>
                  <span className="text-white">{project.progressData?.approvedAssets || 0} / {project.progressData?.totalAssets || 0}</span>
                </div>
                <div className="w-full bg-[#121212] rounded-full h-1.5 mb-1.5 overflow-hidden border border-[#333333]">
                  <div
                    className="bg-gradient-to-r from-[#9d4edd] to-[#ff477e] h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progressData?.progress || 0}%`,
                    }}
                  ></div>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-mono">
                  {project.progressData?.progress || 0}% complete
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* COMPLETED & ARCHIVED SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 pt-8 border-t border-[#333333]">
        
        {/* COMPLETED PROJECTS DRAWER */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Completed Projects</h3>
                <p className="text-xs text-gray-400">{completedProjects.length} finished productions</p>
              </div>
            </div>
            {completedProjects.length > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#121212] border border-[#333333] text-gray-300 hover:text-white hover:border-[#10b981] transition-colors"
              >
                {showCompleted ? "Hide ▲" : "View All ▼"}
              </button>
            )}
          </div>

          {completedProjects.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No completed projects yet.</p>
          ) : showCompleted ? (
            <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
              {completedProjects.map((project) => (
                <Link
                  key={project._id}
                  to={`/project/${project._id}`}
                  className="block p-4 rounded-lg bg-[#121212] border border-[#333333] hover:border-[#10b981] transition-all no-underline group"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#10b981] transition-colors">{project.name}</h4>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded font-mono">100%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{project.description || "No description."}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Click "View All" to browse completed deliverables.</p>
          )}
        </div>

        {/* ARCHIVED PROJECTS DRAWER */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#9d4edd]/20 text-[#9d4edd] flex items-center justify-center font-bold">
                📁
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Archived Projects</h3>
                <p className="text-xs text-gray-400">{archivedProjects.length} legacy studio files</p>
              </div>
            </div>
            {archivedProjects.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#121212] border border-[#333333] text-gray-300 hover:text-white hover:border-[#9d4edd] transition-colors"
              >
                {showArchived ? "Hide ▲" : "View All ▼"}
              </button>
            )}
          </div>

          {archivedProjects.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No archived projects.</p>
          ) : showArchived ? (
            <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
              {archivedProjects.map((project) => (
                <Link
                  key={project._id}
                  to={`/project/${project._id}`}
                  className="block p-4 rounded-lg bg-[#121212] border border-[#333333] hover:border-[#9d4edd] transition-all no-underline group opacity-75 hover:opacity-100"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{project.name}</h4>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">Archived</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description || "No description."}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Click "View All" to browse legacy projects.</p>
          )}
        </div>

      </div>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-1 text-white">Initialize New Project</h2>
            <p className="text-gray-400 text-sm mb-8">Set up the foundation for a new production pipeline.</p>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                  placeholder="e.g., Q3 Marketing Campaign"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm h-24 resize-none"
                  placeholder="Brief overview of deliverables..."
                ></textarea>
              </div>

              <div className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-2' : ''} gap-6`}>
                {isManager && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client</label>
                    {usersLoading ? (
                      <p className="text-sm text-gray-500 py-3">Loading clients...</p>
                    ) : (
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                      >
                        <option value="">No client assigned</option>
                        {users.filter((user) => user.role === "client").map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.firstName} {client.lastName} — {client.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {isManager && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority Level</label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                      className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${isManager ? 'md:col-span-2' : ''}`}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="bg-[#121212] border border-[#333333] text-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* PROJECT MEMBERS INPUT */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#333333]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Members (Optional)</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="sm:col-span-6 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="">Select a team member</option>
                      {users
                        .filter(
                          (candidate) =>
                            candidate._id !== user?._id &&
                            candidate.role !== "client" &&
                            !selectedMembers.some(
                              (member) => member.user === candidate._id,
                            ),
                        )
                        .map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.firstName} {member.lastName} — {member.role}
                          </option>
                        ))}
                    </select>

                    {isManager ? (
                      <select
                        value={selectedMemberRole}
                        onChange={(e) => setSelectedMemberRole(e.target.value)}
                        className="sm:col-span-4 bg-[#121212] border border-[#333333] text-white px-3 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                      >
                        <option value="artist">Artist</option>
                        <option value="manager">Manager</option>
                      </select>
                    ) : (
                      <select
                        value="artist"
                        disabled
                        className="sm:col-span-4 bg-[#121212] border border-[#333333] text-gray-500 px-3 py-3 rounded-lg focus:outline-none text-sm cursor-not-allowed appearance-none"
                      >
                        <option value="artist">Co-Artist</option>
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedMemberId) return;
                        setSelectedMembers((prev) => [
                          ...prev,
                          {
                            user: selectedMemberId,
                            role: isManager ? selectedMemberRole : "artist",
                          },
                        ]);
                        setSelectedMemberId("");
                      }}
                      className="sm:col-span-2 btn-secondary py-3 text-sm font-semibold flex items-center justify-center"
                    >
                      + Add
                    </button>
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedMembers.map((member) => {
                      const memberUser = users.find(
                        (u) => u._id === member.user,
                      );
                      if (!memberUser) return null;
                      return (
                        <div
                          key={member.user}
                          className="flex items-center justify-between bg-[#121212] border border-[#333333] rounded-lg px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {memberUser.firstName} {memberUser.lastName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMembers((prev) =>
                                prev.filter(
                                  (item) => item.user !== member.user,
                                ),
                              )
                            }
                            className="text-xs text-[#ff477e] hover:text-white"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#333333]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-medium px-4">Cancel</button>
                <button type="submit" className="btn-primary py-2.5 px-8 font-bold">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-1 text-white">Edit Project Details</h2>
            <p className="text-gray-400 text-sm mb-8">Update project specifications and target goals.</p>

            <form onSubmit={handleUpdateProject} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Title</label>
                <input
                  type="text"
                  required
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Description</label>
                <textarea
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm h-24 resize-none"
                ></textarea>
              </div>

              <div className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-2' : ''} gap-6`}>
                {isManager && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client</label>
                    {usersLoading ? (
                      <p className="text-sm text-gray-500 py-3">Loading clients...</p>
                    ) : (
                      <select
                        value={editingProject.client}
                        onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                        className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                      >
                        <option value="">No client assigned</option>
                        {users.filter((user) => user.role === "client").map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.firstName} {client.lastName} — {client.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {isManager && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority Level</label>
                    <select
                      value={editingProject.priority}
                      onChange={(e) => setEditingProject({ ...editingProject, priority: e.target.value })}
                      className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${isManager ? 'md:col-span-2' : ''}`}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Deadline</label>
                  <input
                    type="date"
                    value={editingProject.deadline}
                    onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                    className="bg-[#121212] border border-[#333333] text-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* EDIT PROJECT MEMBERS SECTION */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#333333]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Members (Optional)</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="sm:col-span-6 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                    >
                      <option value="">Select a team member</option>
                      {users
                        .filter(
                          (candidate) =>
                            candidate._id !== user?._id &&
                            candidate.role !== "client" &&
                            !editingProject.members.some(
                              (member) => member.user === candidate._id,
                            ),
                        )
                        .map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.firstName} {member.lastName} — {member.role}
                          </option>
                        ))}
                    </select>

                    {isManager ? (
                      <select
                        value={selectedMemberRole}
                        onChange={(e) => setSelectedMemberRole(e.target.value)}
                        className="sm:col-span-4 bg-[#121212] border border-[#333333] text-white px-3 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm"
                      >
                        <option value="artist">Artist</option>
                        <option value="manager">Manager</option>
                      </select>
                    ) : (
                      <select
                        value="artist"
                        disabled
                        className="sm:col-span-4 bg-[#121212] border border-[#333333] text-gray-500 px-3 py-3 rounded-lg focus:outline-none text-sm cursor-not-allowed appearance-none"
                      >
                        <option value="artist">Co-Artist</option>
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedMemberId) return;
                        setEditingProject((prev) => ({
                          ...prev,
                          members: [
                            ...prev.members,
                            { user: selectedMemberId, role: isManager ? selectedMemberRole : "artist" },
                          ],
                        }));
                        setSelectedMemberId("");
                      }}
                      className="sm:col-span-2 btn-secondary py-3 text-sm font-semibold flex items-center justify-center"
                    >
                      + Add
                    </button>
                  </div>
                )}

                {editingProject.members.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {editingProject.members.map((member) => {
                      const memberUser = users.find(
                        (u) => u._id === member.user,
                      );
                      if (!memberUser) return null;
                      return (
                        <div
                          key={member.user}
                          className="flex items-center justify-between bg-[#121212] border border-[#333333] rounded-lg px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {memberUser.firstName} {memberUser.lastName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProject((prev) => ({
                                ...prev,
                                members: prev.members.filter(
                                  (item) => item.user !== member.user,
                                ),
                              }))
                            }
                            className="text-xs text-[#ff477e] hover:text-white"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#333333]">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-medium px-4">Cancel</button>
                <button type="submit" className="btn-primary py-2.5 px-8 font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;