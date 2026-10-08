import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  updateMyProfile,
  changeMyPassword,
  getMyAuditLogs,
} from "../services/authService";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    about: "",
    department: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const getActivityPresentation = (log) => {
    switch (log.action) {
      case "ACCOUNT_CREATED":
        return {
          icon: "✨",
          title: "Created Arian account",
          subtitle: log.details,
        };

      case "LOGIN_SUCCESS":
        return {
          icon: "🔐",
          title: "Signed into Arian",
          subtitle: "Successful account login",
        };

      case "PROFILE_UPDATED":
        return {
          icon: "👤",
          title: "Updated profile information",
          subtitle: log.details,
        };

      case "PASSWORD_CHANGED":
        return {
          icon: "🔑",
          title: "Changed account password",
          subtitle: log.details,
        };

      case "PROJECT_CREATED":
        return {
          icon: "📁",
          title: "Created a new project",
          subtitle: log.details,
        };

      case "PROJECT_UPDATED":
        return {
          icon: "✏️",
          title: "Updated a project",
          subtitle: log.details,
        };

      case "PROJECT_DELETED":
        return {
          icon: "🗑️",
          title: "Deleted a project",
          subtitle: log.details,
        };

      case "MEMBER_ADDED":
        return {
          icon: "👥",
          title: "Added a project member",
          subtitle: log.details,
        };

      case "MEMBER_REMOVED":
        return {
          icon: "👤",
          title: "Removed a project member",
          subtitle: log.details,
        };

      case "ASSET_CREATED":
        return {
          icon: "🎨",
          title: "Created a new asset",
          subtitle: log.details,
        };

      case "ASSET_UPDATED":
        return {
          icon: "✏️",
          title: "Updated an asset",
          subtitle: log.details,
        };

      case "ASSET_DELETED":
        return {
          icon: "🗑️",
          title: "Deleted an asset",
          subtitle: log.details,
        };

      case "VERSION_UPLOADED":
        return {
          icon: "⬆️",
          title: "Uploaded a new asset version",
          subtitle: log.details,
        };

      case "ASSET_APPROVED":
        return {
          icon: "✅",
          title: "Approved an asset",
          subtitle: log.details,
        };

      case "ASSET_REJECTED":
        return {
          icon: "❌",
          title: "Rejected an asset",
          subtitle: log.details,
        };

      case "REVISION_REQUESTED":
        return {
          icon: "↻",
          title: "Requested a revision",
          subtitle: log.details,
        };

      case "FEEDBACK_POSTED":
        return {
          icon: "💬",
          title: "Posted feedback",
          subtitle: log.details,
        };

      case "FEEDBACK_UPDATED":
        return {
          icon: "📝",
          title: "Updated feedback",
          subtitle: log.details,
        };

      case "FEEDBACK_DELETED":
        return {
          icon: "🗑️",
          title: "Deleted feedback",
          subtitle: log.details,
        };

      case "TASK_CREATED":
        return {
          icon: "📋",
          title: "Created a task",
          subtitle: log.details,
        };

      case "TASK_COMPLETED":
        return {
          icon: "☑️",
          title: "Completed a task",
          subtitle: log.details,
        };

      case "TASK_REOPENED":
        return {
          icon: "↩️",
          title: "Reopened a task",
          subtitle: log.details,
        };

      case "TASK_UPDATED":
        return {
          icon: "✏️",
          title: "Updated a task",
          subtitle: log.details,
        };

      case "TASK_DELETED":
        return {
          icon: "🗑️",
          title: "Deleted a task",
          subtitle: log.details,
        };

      default:
        return {
          icon: "📝",
          title: log.action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase()),
          subtitle: log.details || "System activity recorded",
        };
    }
  };

  const recentActivities = auditLogs.slice(0, 3);

  useEffect(() => {
    if (!user) return;

    setProfileData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      about: user.about || "",
      department: user.department || "",
    });
  }, [user]);

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);

      const data = await getMyAuditLogs();

      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await updateMyProfile(profileData);

      updateUser(data.user);

      setIsEditing(false);
      setSuccess("Profile updated successfully.");

      await loadAuditLogs();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      setPasswordLoading(true);
      setError("");
      setSuccess("");

      await changeMyPassword(passwordData);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password changed successfully.");

      await loadAuditLogs();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-[#ff477e] bg-[#ff477e]/10 text-[#ff477e] text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg border border-[#10b981] bg-[#10b981]/10 text-[#10b981] text-sm">
          {success}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-[#9d4edd] via-[#ff477e] to-[#ffd166]" />

        <div className="px-8 pb-8">
          <div className="flex justify-between items-end mb-6">
            <div className="w-32 h-32 rounded-full bg-[#121212] border-4 border-[#1e1e1e] flex items-center justify-center text-white text-4xl font-bold shadow-xl -mt-16 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center">
                {profileData.firstName?.charAt(0)}
                {profileData.lastName?.charAt(0)}
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary py-2 px-6 text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-white px-4"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="btn-primary py-2 px-6"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div className="mb-8">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                <input
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="First name"
                  className="profile-input"
                />

                <input
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      lastName: e.target.value,
                    })
                  }
                  placeholder="Last name"
                  className="profile-input"
                />

                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email"
                  className="profile-input md:col-span-2"
                />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-white">{fullName}</h1>

                <p className="text-gray-400 mt-1">{profileData.email}</p>
              </>
            )}

            <span className="inline-block bg-[#1e1e1e] text-[#ffd166] border border-[#333333] px-3 py-1 mt-3 rounded-md text-xs font-bold uppercase">
              {user?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#333333] pt-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">About Me</h3>

              {isEditing ? (
                <textarea
                  value={profileData.about}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      about: e.target.value,
                    })
                  }
                  className="profile-input w-full h-32 resize-none"
                  placeholder="Tell the team about yourself..."
                />
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {profileData.about || "No information provided."}
                </p>
              )}

              {/* <h3 className="text-lg font-bold text-white mt-8 mb-4">
                Contact Information
              </h3>*/}

              <div className="space-y-3 text-sm">
                <h3 className="text-lg font-bold text-white mt-8 mb-4">
                  Change Password
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Current password"
                    className="profile-input w-full"
                  />

                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="New password"
                    className="profile-input w-full"
                  />

                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    className="profile-input w-full"
                  />

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-secondary w-full py-2"
                  >
                    {passwordLoading
                      ? "Changing Password..."
                      : "Change Password"}
                  </button>
                </form>
                <div className="flex justify-between border-b border-[#333333] pb-2">
                  {/* <span className="text-gray-400">Department</span> 
                  {isEditing ? (
                    <input
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          department: e.target.value,
                        })
                      }
                      className="profile-input text-right"
                    />
                  ) : (
                    <span className="text-white">
                      {profileData.department || "Not specified"}
                    </span>
                  )}*/}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Recent Studio Activity
              </h3>

              <div className="space-y-4">
                {auditLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading recent activity...
                  </p>
                ) : recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No recent activity recorded.
                  </p>
                ) : (
                  recentActivities.map((log) => {
                    const activity = getActivityPresentation(log);

                    return (
                      <div key={log._id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#121212] border border-[#333333] flex items-center justify-center text-lg shrink-0">
                          {activity.icon}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {activity.title}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {activity.subtitle}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-[#333333]">
            <h3 className="text-lg font-bold text-white mb-6">
              System Audit Log
            </h3>

            {auditLoading ? (
              <p className="text-sm text-gray-500">Loading audit history...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No audit activity recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#333333] text-gray-400">
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#333333]">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="text-white hover:bg-white/5">
                        <td className="py-4 font-mono text-xs text-[#ff477e]">
                          {log.action}
                        </td>

                        <td className="py-4 text-gray-400 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="py-4">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
