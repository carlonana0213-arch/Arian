const express = require("express");

const {
  register,
  login,
  getMe,
  updateMyProfile,
  changeMyPassword,
  getMyAuditLogs,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

router.patch("/me", protect, updateMyProfile);

router.patch("/me/password", protect, changeMyPassword);

router.get("/me/audit-logs", protect, getMyAuditLogs);

module.exports = router;
