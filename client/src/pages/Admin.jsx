import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAdminAuditLogs,
  getAuditActions,
  getAdminUsers,
  updateAdminUser,
} from "../services/adminService";

const Admin = () => {
  const { user } = useAuth();

  // ============================================================
  // ACCESS CONTROL
  // ============================================================
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ============================================================
  // AUDIT LOG STATE
  // ============================================================
  const [logs, setLogs] = useState([]);
  const [auditActions, setAuditActions] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedLogUser, setSelectedLogUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  // ============================================================
  // USER STATE
  // ============================================================
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [userSaving, setUserSaving] = useState(false);

  // ============================================================
  // LOAD AUDIT LOGS
  // ============================================================
  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");

      const data = await getAdminAuditLogs({
        page: logPage,
        user: selectedLogUser,
        action: selectedAction,
      });

      setLogs(data.logs || []);
      setLogPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (error) {
      console.error("Failed to load audit logs:", error);

      setLogsError(
        error.response?.data?.message || "Failed to load audit logs.",
      );
    } finally {
      setLogsLoading(false);
    }
  };

  // ============================================================
  // LOAD USERS
  // ============================================================
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const data = await getAdminUsers();

      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);

      setUsersError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  // ============================================================
  // LOAD AVAILABLE AUDIT ACTIONS
  // ============================================================
  const loadAuditActions = async () => {
    try {
      const data = await getAuditActions();

      setAuditActions(data.actions || []);
    } catch (error) {
      console.error("Failed to load audit actions:", error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [logPage, selectedLogUser, selectedAction]);

  useEffect(() => {
    loadUsers();
    loadAuditActions();
  }, []);

  // ============================================================
  // FILTER HANDLERS
  // ============================================================
  const handleUserFilterChange = (value) => {
    setSelectedLogUser(value);
    setLogPage(1);
  };

  const handleActionFilterChange = (value) => {
    setSelectedAction(value);
    setLogPage(1);
  };

  const clearLogFilters = () => {
    setSelectedLogUser("");
    setSelectedAction("");
    setLogPage(1);
  };

  // ============================================================
  // USER EDIT
  // ============================================================
  const openEditUser = (selectedUser) => {
    setEditingUser({
      _id: selectedUser._id,
      firstName: selectedUser.firstName || "",
      lastName: selectedUser.lastName || "",
      email: selectedUser.email || "",
      about: selectedUser.about || "",
      department: selectedUser.department || "",
      role: selectedUser.role || "artist",
      isActive: selectedUser.isActive,
    });
  };

  const closeEditUser = () => {
    if (userSaving) return;

    setEditingUser(null);
  };

  const handleEditUserChange = (field, value) => {
    setEditingUser((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      setUserSaving(true);
      setUsersError("");

      const data = await updateAdminUser(editingUser._id, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        about: editingUser.about,
        department: editingUser.department,
        role: editingUser.role,
        isActive: editingUser.isActive,
      });

      setUsers((current) =>
        current.map((existingUser) =>
          existingUser._id === data.user._id
            ? {
                ...existingUser,
                ...data.user,
              }
            : existingUser,
        ),
      );

      setEditingUser(null);

      // Refresh logs because the admin update itself
      // creates an audit record.
      setLogPage(1);
      await loadLogs();
    } catch (error) {
      console.error("Failed to update user:", error);

      setUsersError(error.response?.data?.message || "Failed to update user.");
    } finally {
      setUserSaving(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getUserName = (logUser) => {
    if (!logUser) return "Unknown User";

    return `${logUser.firstName || ""} ${logUser.lastName || ""}`.trim();
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="mb-10 border-b border-[#333333] pb-6">
        <h1 className="text-3xl font-bold text-white">Admin Console</h1>

        <p className="text-gray-400 mt-2 text-sm">
          Manage users and review system activity.
        </p>
      </header>

      {/* ======================================================
          AUDIT LOGS
      ====================================================== */}
      <section className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Audit Logs</h2>

            <p className="text-sm text-gray-500 mt-1">
              Review recorded system activity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* USER FILTER */}
            <select
              value={selectedLogUser}
              onChange={(e) => handleUserFilterChange(e.target.value)}
              className="bg-[#121212] border border-[#333333] text-white px-4 py-2.5 rounded-md text-sm focus:outline-none focus:border-[#9d4edd]"
            >
              <option value="">All Users</option>

              {users.map((userItem) => (
                <option key={userItem._id} value={userItem._id}>
                  {getUserName(userItem)}
                </option>
              ))}
            </select>

            {/* ACTION FILTER */}
            <select
              value={selectedAction}
              onChange={(e) => handleActionFilterChange(e.target.value)}
              className="bg-[#121212] border border-[#333333] text-white px-4 py-2.5 rounded-md text-sm focus:outline-none focus:border-[#9d4edd]"
            >
              <option value="">All Actions</option>

              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <button
              onClick={clearLogFilters}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {logsError && (
          <div className="mb-4 p-3 rounded-lg border border-[#ff477e] bg-[#ff477e]/10 text-[#ff477e] text-sm">
            {logsError}
          </div>
        )}

        <div className="glass-panel overflow-hidden">
          {logsLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No audit logs found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#333333] text-gray-400">
                      <th className="px-5 py-4">User</th>

                      <th className="px-5 py-4">Action</th>

                      <th className="px-5 py-4">Details</th>

                      <th className="px-5 py-4">IP Address</th>

                      <th className="px-5 py-4">Timestamp</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#333333]">
                    {logs.map((log) => (
                      <tr key={log._id} className="text-white hover:bg-white/5">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium">
                              {getUserName(log.user)}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {log.user?.email || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-block px-2.5 py-1 rounded bg-[#ff477e]/10 border border-[#ff477e]/20 text-[#ff477e] text-xs font-mono">
                            {log.action}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-300 max-w-md">
                          {log.details || "—"}
                        </td>

                        <td className="px-5 py-4 text-gray-500 text-xs font-mono">
                          {log.ipAddress || "—"}
                        </td>

                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-[#333333]">
                <p className="text-xs text-gray-500">
                  {logPagination.total} total logs
                </p>

                <div className="flex items-center gap-3">
                  <button
                    disabled={logPage <= 1}
                    onClick={() => setLogPage((page) => Math.max(page - 1, 1))}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <span className="text-xs text-gray-400">
                    Page {logPagination.page} of{" "}
                    {Math.max(logPagination.totalPages, 1)}
                  </span>

                  <button
                    disabled={logPage >= logPagination.totalPages}
                    onClick={() =>
                      setLogPage((page) =>
                        Math.min(page + 1, logPagination.totalPages),
                      )
                    }
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ======================================================
          USER MANAGEMENT
      ====================================================== */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">User Management</h2>

          <p className="text-sm text-gray-500 mt-1">
            View and edit Arian user accounts.
          </p>
        </div>

        {usersError && (
          <div className="mb-4 p-3 rounded-lg border border-[#ff477e] bg-[#ff477e]/10 text-[#ff477e] text-sm">
            {usersError}
          </div>
        )}

        <div className="glass-panel overflow-hidden">
          {usersLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333333] text-gray-400">
                    <th className="px-5 py-4">Name</th>

                    <th className="px-5 py-4">Email</th>

                    <th className="px-5 py-4">Role</th>

                    <th className="px-5 py-4">Department</th>

                    <th className="px-5 py-4">Status</th>

                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#333333]">
                  {users.map((userItem) => (
                    <tr
                      key={userItem._id}
                      className="text-white hover:bg-white/5"
                    >
                      <td className="px-5 py-4 font-medium">
                        {getUserName(userItem)}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {userItem.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize text-xs px-2.5 py-1 rounded bg-[#9d4edd]/10 text-[#9d4edd] border border-[#9d4edd]/20">
                          {userItem.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {userItem.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded border ${
                            userItem.isActive
                              ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                              : "bg-[#ff477e]/10 text-[#ff477e] border-[#ff477e]/20"
                          }`}
                        >
                          {userItem.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditUser(userItem)}
                          className="btn-secondary px-4 py-2 text-xs"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          EDIT USER MODAL
      ====================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeEditUser}
              className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-white">Edit User</h2>

            <p className="text-sm text-gray-500 mt-1 mb-7">
              Update account information and permissions.
            </p>

            <form onSubmit={handleSaveUser} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    First Name
                  </label>

                  <input
                    required
                    value={editingUser.firstName}
                    onChange={(e) =>
                      handleEditUserChange("firstName", e.target.value)
                    }
                    className="profile-input w-full mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Last Name
                  </label>

                  <input
                    required
                    value={editingUser.lastName}
                    onChange={(e) =>
                      handleEditUserChange("lastName", e.target.value)
                    }
                    className="profile-input w-full mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    handleEditUserChange("email", e.target.value)
                  }
                  className="profile-input w-full mt-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Department
                </label>

                <input
                  value={editingUser.department}
                  onChange={(e) =>
                    handleEditUserChange("department", e.target.value)
                  }
                  className="profile-input w-full mt-1.5"
                  placeholder="e.g. Animation"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  About
                </label>

                <textarea
                  value={editingUser.about}
                  onChange={(e) =>
                    handleEditUserChange("about", e.target.value)
                  }
                  className="profile-input w-full mt-1.5 h-28 resize-none"
                  placeholder="About this user..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Role
                  </label>

                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      handleEditUserChange("role", e.target.value)
                    }
                    className="profile-input w-full mt-1.5"
                  >
                    <option value="artist">Artist</option>
                    <option value="manager">Manager</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Account Status
                  </label>

                  <select
                    value={editingUser.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      handleEditUserChange(
                        "isActive",
                        e.target.value === "active",
                      )
                    }
                    className="profile-input w-full mt-1.5"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={closeEditUser}
                  disabled={userSaving}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={userSaving}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  {userSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
