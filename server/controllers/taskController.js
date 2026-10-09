const Task = require("../models/Task");
const Asset = require("../models/Asset");
const Project = require("../models/Project");
const createAuditLog = require("../utils/createAuditLog");
const createNotifications = require("../utils/createNotification");
const getProjectRecipients = require("../utils/getProjectRecipients");

const hasProjectAccess = (project, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (project.manager && project.manager.toString() === user._id.toString()) {
    return true;
  }

  if (project.client && project.client.toString() === user._id.toString()) {
    return true;
  }

  return project.members.some(
    (member) => member.user && member.user.toString() === user._id.toString(),
  );
};

const createTask = async (req, res) => {
  try {
    const { assetId, title, description, assignedTo, deadline } = req.body;

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

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You are not a member of this project.",
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
      description: description ? description.trim() : "",
      assignedTo: assignedTo || null,
      deadline: deadline && deadline !== "" ? new Date(deadline) : null,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email role");

    await createAuditLog({
      userId: req.user._id,
      action: "TASK_CREATED",
      details: `Created task "${task.title}" for asset "${asset.title}".`,
      req,
    });

    await createNotifications({
      recipientIds: getProjectRecipients(project),
      projectId: project._id,
      actorId: req.user._id,
      type: "task_created",
      message: `A new task "${task.title}" was created for "${asset.title}".`,
    });

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

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

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

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("project", "name")
      .populate("asset", "title")
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ message: "Failed to load all tasks" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, description, assignedTo, deadline } = req.body;

    const task = await Task.findById(id);

    const project = await Project.findById(task.project);

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

    if (typeof completed === "boolean") {
      await createAuditLog({
        userId: req.user._id,
        action: completed ? "TASK_COMPLETED" : "TASK_REOPENED",
        details: completed
          ? `Completed task "${task.title}".`
          : `Reopened task "${task.title}".`,
        req,
      });

      await createNotifications({
        recipientIds: getProjectRecipients(project),
        projectId: project._id,
        actorId: req.user._id,
        type: completed ? "task_completed" : "task_reopened",
        message: completed
          ? `Task "${task.title}" was completed.`
          : `Task "${task.title}" was reopened.`,
      });
    }

    if (title !== undefined) {
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo || null;
    }

    if (deadline !== undefined) {
      task.deadline = deadline && deadline !== "" ? new Date(deadline) : null;
    }

    await task.save();

    if (typeof completed === "boolean") {
      await createAuditLog({
        userId: req.user._id,
        action: completed ? "TASK_COMPLETED" : "TASK_REOPENED",
        details: completed
          ? `Completed task "${task.title}".`
          : `Reopened task "${task.title}".`,
        req,
      });
    } else if (
      title !== undefined ||
      description !== undefined ||
      assignedTo !== undefined
    ) {
      await createAuditLog({
        userId: req.user._id,
        action: "TASK_UPDATED",
        details: `Updated task "${task.title}".`,
        req,
      });
    }

    await createNotifications({
      recipientIds: getProjectRecipients(project),
      projectId: project._id,
      actorId: req.user._id,
      type: "task_updated",
      message: `Task "${task.title}" was updated.`,
    });

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

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    await createAuditLog({
      userId: req.user._id,
      action: "TASK_DELETED",
      details: `Deleted task "${task.title}".`,
      req,
    });

    await createNotifications({
      recipientIds: getProjectRecipients(project),
      projectId: project._id,
      actorId: req.user._id,
      type: "task_deleted",
      message: `Task "${task.title}" was deleted.`,
    });

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
  getAllTasks,
  updateTask,
  deleteTask,
};