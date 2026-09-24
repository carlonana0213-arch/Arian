const Project = require("../models/Project");
const User = require("../models/User");

//create
const createProject = async (req, res) => {
  try {
    const { name, description, client, startDate, deadline, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    const project = await Project.create({
      name,
      description,
      manager: req.user._id,
      client: client || undefined,
      startDate,
      deadline,
      status: status || "planning",
      members: [
        {
          user: req.user._id,
          role: "manager",
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    res.status(201).json({
      message: "Project created successfully.",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project.",
    });
  }
};

//get all
const getProjects = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      filter = {
        $or: [
          { manager: req.user._id },
          { client: req.user._id },
          {
            "members.user": req.user._id,
          },
        ],
      };
    }

    const projects = await Project.find(filter)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to retrieve projects.",
    });
  }
};

//get
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const hasAccess =
      req.user.role === "admin" ||
      project.manager?._id.toString() === req.user._id.toString() ||
      project.client?._id?.toString() === req.user._id.toString() ||
      project.members.some(
        (member) => member.user?._id.toString() === req.user._id.toString(),
      );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

    res.json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to retrieve project.",
    });
  }
};

//update
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can update this project.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "client",
      "startDate",
      "deadline",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    res.json({
      message: "Project updated successfully.",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      message: "Failed to update project.",
    });
  }
};

//delete
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can delete this project.",
      });
    }

    await project.deleteOne();

    res.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      message: "Failed to delete project.",
    });
  }
};

//add
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: "userId and role are required.",
      });
    }

    if (!["artist", "manager", "client"].includes(role)) {
      return res.status(400).json({
        message: "Invalid project member role.",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can add members.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const alreadyMember = project.members.some(
      (member) => member.user.toString() === userId,
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User is already a member of this project.",
      });
    }

    project.members.push({
      user: userId,
      role,
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    res.status(201).json({
      message: "Member added successfully.",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Add member error:", error);

    res.status(500).json({
      message: "Failed to add project member.",
    });
  }
};

//remove
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can remove members.",
      });
    }

    project.members = project.members.filter(
      (member) => member.user.toString() !== req.params.userId,
    );

    await project.save();

    res.json({
      message: "Member removed successfully.",
    });
  } catch (error) {
    console.error("Remove member error:", error);

    res.status(500).json({
      message: "Failed to remove project member.",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
