const Task = require("../models/Task");
const Asset = require("../models/Asset");
const Project = require("../models/Project");

const createTask = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { title, description, assignedTo } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isManager = req.user.role === "admin" || req.user.role === "manager";

    const isArtist = req.user.role === "artist";

    if (!isManager && !isArtist) {
      return res.status(403).json({
        message: "You do not have permission to create tasks",
      });
    }

    const task = await Task.create({
      project: project._id,
      asset: asset._id,
      title: title.trim(),
      description: description || "",
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email role");

    res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      message: "Failed to create task",
    });
  }
};

const getAssetTasks = async (req, res) => {
  try {
    const { assetId } = req.params;

    const tasks = await Task.find({
      asset: assetId,
    })
      .populate("assignedTo", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email role")
      .sort({ createdAt: 1 });

    res.json({
      tasks,
    });
  } catch (error) {
    console.error("Get asset tasks error:", error);

    res.status(500).json({
      message: "Failed to load tasks",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, description, assignedTo } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const isManager = req.user.role === "admin" || req.user.role === "manager";

    const isArtist = req.user.role === "artist";

    if (!isManager && !isArtist) {
      return res.status(403).json({
        message: "You do not have permission to update tasks",
      });
    }

    if (typeof completed === "boolean") {
      task.completed = completed;
      task.completedAt = completed ? new Date() : null;
    }

    if (isManager) {
      if (title !== undefined) {
        task.title = title.trim();
      }

      if (description !== undefined) {
        task.description = description;
      }

      if (assignedTo !== undefined) {
        task.assignedTo = assignedTo || null;
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email role");

    res.json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      message: "Failed to update task",
    });
  }
};
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({
        message: "You do not have permission to delete tasks",
      });
    }

    await task.deleteOne();

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      message: "Failed to delete task",
    });
  }
};

module.exports = {
  createTask,
  getAssetTasks,
  updateTask,
  deleteTask,
};
