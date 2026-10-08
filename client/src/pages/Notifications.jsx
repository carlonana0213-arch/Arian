import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";

const Notifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState("all");

  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "asset_approved":
        return (
          <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-sm border border-[#10b981]/30">
            ✓
          </div>
        );

      case "asset_rejected":
      case "revision_requested":
        return (
          <div className="w-8 h-8 rounded-full bg-[#ff477e]/20 text-[#ff477e] flex items-center justify-center text-sm border border-[#ff477e]/30">
            ↻
          </div>
        );

      case "feedback_posted":
      case "feedback_updated":
      case "feedback_deleted":
        return (
          <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 text-[#9d4edd] flex items-center justify-center text-sm border border-[#9d4edd]/30">
            💬
          </div>
        );

      case "task_completed":
        return (
          <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-sm border border-[#10b981]/30">
            ✓
          </div>
        );

      case "project_added":
        return (
          <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 text-[#9d4edd] flex items-center justify-center text-sm border border-[#9d4edd]/30">
            +
          </div>
        );

      default:
        return (
          <div className="w-8 h-8 rounded-full bg-[#ffd166]/20 text-[#ffd166] flex items-center justify-center text-sm border border-[#ffd166]/30">
            !
          </div>
        );
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 border-b border-[#333333] pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-[#ff477e] text-white text-xs font-bold px-2 py-0.5 rounded-full tracking-wider shadow-[0_0_10px_rgba(255,71,126,0.5)]">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Stay updated on project approvals, revisions, and mentions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            ✓ Mark all as read
          </button>
        )}
      </header>

      <div className="glass-panel overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex border-b border-[#333333] bg-[#1e1e1e]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === "all" ? "text-[#ffd166]" : "text-gray-400 hover:text-white"}`}
          >
            All
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffd166]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === "unread" ? "text-[#ffd166]" : "text-gray-400 hover:text-white"}`}
          >
            Unread
            {activeTab === "unread" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffd166]"></div>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#121212]">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center text-3xl mb-4 opacity-50">
                📭
              </div>
              <p className="text-white font-bold text-lg mb-1">
                All caught up!
              </p>
              <p className="text-gray-500 text-sm">
                You have no {activeTab === "unread" ? "unread " : ""}
                notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#333333]">
              {displayedNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`flex items-start gap-4 p-5 transition-colors group relative
                    ${notif.read ? "hover:bg-white/5" : "bg-white/5 hover:bg-white/10"}
                  `}
                >
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff477e]"></div>
                  )}

                  <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {notif.project?.name || "Project"}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p
                      className={`text-sm mb-2 ${notif.read ? "text-gray-300" : "text-white font-medium"}`}
                    >
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4">
                      <Link
                        to={notif.link}
                        className="text-xs font-bold text-[#9d4edd] hover:text-[#ff477e] transition-colors"
                      >
                        View Details →
                      </Link>

                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
