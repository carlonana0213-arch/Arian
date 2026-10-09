const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

// ============================================================
// GET AUDIT LOGS
// Admin only
// Supports:
// - pagination
// - filtering by user
// - filtering by action
// ============================================================
const getAuditLogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, user, action } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 10);

    const filter = {};

    // Filter by specific user
    if (user) {
      filter.user = user;
    }

    // Filter by action
    if (action) {
      filter.action = action;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get admin audit logs error:", error);

    res.status(500).json({
      message: "Failed to retrieve audit logs.",
    });
  }
};

// ============================================================
// GET ALL USERS
// Admin only
// ============================================================
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      users,
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    res.status(500).json({
      message: "Failed to retrieve users.",
    });
  }
};

// ============================================================
// GET AVAILABLE AUDIT ACTIONS
// Used by the frontend action filter
// ============================================================
const getAuditActions = async (req, res) => {
  try {
    const actions = await AuditLog.distinct("action");

    actions.sort();

    res.json({
      actions,
    });
  } catch (error) {
    console.error("Get audit actions error:", error);

    res.status(500).json({
      message: "Failed to retrieve audit actions.",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAdminUsers,
  getAuditActions,
};
