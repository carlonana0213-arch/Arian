const express = require("express");

const {
  getAuditLogs,
  getAdminUsers,
  getAuditActions,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Every admin route requires authentication AND admin role.
router.use(protect, authorize("admin"));

// Audit logs
router.get("/audit-logs", getAuditLogs);

// Available audit actions for the filter dropdown
router.get("/audit-actions", getAuditActions);

// Users
router.get("/users", getAdminUsers);

module.exports = router;
