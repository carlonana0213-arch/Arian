import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../services/notificationService";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const [notificationData, countData] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notificationData.notifications || []);
      setUnreadCount(countData.count || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="h-[73px] bg-[#121212] border-b border-[#333333] px-8 flex justify-between items-center sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-bold text-white tracking-tight">
          Ari<span className="text-[#ff477e]">an</span>
        </Link>
        <div className="hidden md:flex gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Projects
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6" ref={dropdownRef}>
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="text-gray-400 hover:text-[#ffd166] transition-colors relative"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff477e] rounded-full"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-4 w-80 glass-panel shadow-2xl py-2 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-[#333333]">
                <h3 className="text-white font-bold text-sm">
                  Recent Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {/* FIXED: hover:bg-[#1e1e1e] -> hover:bg-white/5 */}
                <div className="max-h-64 overflow-y-auto">
                  {notificationLoading ? (
                    <div className="px-4 py-5 text-sm text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <button
                        key={notification._id}
                        onClick={async () => {
                          if (!notification.read) {
                            try {
                              await markNotificationAsRead(notification._id);

                              setNotifications((current) =>
                                current.map((item) =>
                                  item._id === notification._id
                                    ? { ...item, read: true }
                                    : item,
                                ),
                              );

                              setUnreadCount((count) => Math.max(0, count - 1));
                            } catch (error) {
                              console.error(
                                "Failed to mark notification as read:",
                                error,
                              );
                            }
                          }

                          setIsNotifOpen(false);

                          if (notification.project?._id) {
                            navigate(`/project/${notification.project._id}`);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-white/5 border-b border-[#333333] transition-colors ${
                          !notification.read ? "bg-white/5" : ""
                        }`}
                      >
                        <p className="text-sm text-white">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Link
                to="/notifications"
                onClick={() => setIsNotifOpen(false)}
                className="block text-center px-4 py-3 bg-[#121212] border-t border-[#333333] text-xs font-bold text-[#9d4edd] hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#ff477e] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:shadow-lg hover:shadow-[#9d4edd]/50 transition-all"
          ></button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-52 glass-panel shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[#333333] mb-1">
                <p className="text-sm font-bold text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[#ffd166] font-medium truncate mt-0.5">
                  {user.role}
                </p>
              </div>

              {/* FIXED: hover:bg-[#1e1e1e] -> hover:bg-white/5 */}
              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Your Profile
              </Link>

              {/* FIXED: hover:bg-[#1e1e1e] -> hover:bg-white/5 */}
              <Link
                to="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Settings
              </Link>

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Admin Console
                </Link>
              )}

              <div className="border-t border-[#333333] mt-1 pt-1">
                {/* FIXED: hover:bg-[#1e1e1e] -> hover:bg-white/5 */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2.5 text-sm text-[#ff477e] hover:bg-white/5 transition-colors font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
