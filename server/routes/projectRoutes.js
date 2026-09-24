const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require("../controllers/projectController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "manager"), createProject);

router.get("/", protect, getProjects);

router.get("/:id", protect, getProjectById);

router.patch("/:id", protect, authorize("admin", "manager"), updateProject);

router.delete("/:id", protect, authorize("admin", "manager"), deleteProject);

router.post("/:id/members", protect, authorize("admin", "manager"), addMember);

router.delete(
  "/:id/members/:userId",
  protect,
  authorize("admin", "manager"),
  removeMember,
);

module.exports = router;
