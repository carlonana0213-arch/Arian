const Comment = require("../models/Comment");
const Asset = require("../models/Asset");
const Project = require("../models/Project");

const userHasProjectAccess = (project, user) => {
  if (user.role === "admin") {
    return true;
  }
  if (project.manager?.toString() === user._id.toString()) {
    return true;
  }
  if (project.client?.toString() === user._id.toString()) {
    return true;
  }
  return project.members.some(
    (member) => member.user.toString() === user._id.toString(),
  );
};

// ========================================
// CREATE COMMENT
// ========================================
const createComment = async (req, res) => {
  try {
    const { text, type = "comment" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    if (!["comment", "revision_request"].includes(type)) {
      return res.status(400).json({ message: "Invalid comment type." });
    }

    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found." });

    const project = await Project.findById(asset.project);
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({ message: "You do not have access to this asset." });
    }

    if (type === "revision_request") {
      const isProjectManager = req.user.role === "admin" || (project.manager && project.manager.toString() === req.user._id.toString());
      const isManager = req.user.role === "manager";
      if (!isProjectManager && !isManager) {
        return res.status(403).json({ message: "Only managers can request revisions." });
      }
    }

    if (type === "comment") {
      const canComment = req.user.role === "manager" || req.user.role === "client" || req.user.role === "admin";
      if (!canComment) {
        return res.status(403).json({ message: "Only managers and clients can add feedback." });
      }
    }

    const comment = await Comment.create({
      asset: asset._id,
      user: req.user._id,
      text: text.trim(),
      type,
    });

    const populatedComment = await Comment.findById(comment._id).populate("user", "firstName lastName email role");

    res.status(201).json({
      message: type === "revision_request" ? "Revision request submitted successfully." : "Comment added successfully.",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Failed to create comment." });
  }
};

// ========================================
// GET COMMENTS
// ========================================
const getAssetComments = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found." });

    const project = await Project.findById(asset.project);
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({ message: "You do not have access to this asset." });
    }

    const comments = await Comment.find({ asset: asset._id })
      .populate("user", "firstName lastName email role")
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Failed to retrieve comments." });
  }
};

// ========================================
// GET ALL COMMENTS (FOR DASHBOARD)
// ========================================
const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("user", "firstName lastName email role")
      .populate("asset", "title project")
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    console.error("Get all comments error:", error);
    res.status(500).json({ message: "Failed to retrieve all comments." });
  }
};

// ========================================
// UPDATE OWN COMMENT
// ========================================
const updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required." });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") return res.status(403).json({ message: "You can only edit your own comments." });

    comment.text = text.trim();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate("user", "firstName lastName email role");
    res.json({ message: "Comment updated successfully.", comment: updatedComment });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Failed to update comment." });
  }
};

// ========================================
// DELETE COMMENT
// ========================================
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") return res.status(403).json({ message: "You can only delete your own comments." });

    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};

module.exports = {
  createComment,
  getAssetComments,
  getAllComments,
  updateComment,
  deleteComment,
};