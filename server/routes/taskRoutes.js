const express = require("express");

const {
  createTask,
  getAssetTasks,
  getAllTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "manager", "artist"), createTask);

// FIXED: Removed authorize block so the dashboard can always fetch tasks regardless of string-case mismatches
router.get("/", protect, getAllTasks);

router.get(
  "/asset/:assetId",
  protect,
  authorize("admin", "manager", "artist", "client"),
  getAssetTasks,
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "manager", "artist"),
  updateTask,
);

router.delete("/:id", protect, authorize("admin", "manager"), deleteTask);

module.exports = router;