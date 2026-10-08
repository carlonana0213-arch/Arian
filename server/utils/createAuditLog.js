const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({ userId, action, details = "", req = null }) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: req?.ip || "",
      userAgent: req?.get("user-agent") || "",
    });
  } catch (error) {
    // Audit logging should never break the main request.
    console.error("Audit log error:", error);
  }
};

module.exports = createAuditLog;
