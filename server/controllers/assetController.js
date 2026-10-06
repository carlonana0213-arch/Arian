const Asset = require("../models/Asset");
const Project = require("../models/Project");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const userHasProjectAccess = (project, user) => {
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
    (member) => member.user.toString() === user._id.toString(),
  );
};

// ========================================
// CREATE FIRST ASSET + VERSION 1
// ========================================
const createAsset = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assetType } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Asset title is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "An image file is required.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

    // Only artists/managers/admins can upload
    if (!["artist", "manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to upload assets.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `projects/${projectId}/assets`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      stream.end(req.file.buffer);
    });

    const asset = await Asset.create({
      project: projectId,

      title,

      description: description || "",

      assetType: assetType || "image",

      currentVersion: 1,

      versions: [
        {
          versionNumber: 1,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
          status: "pending",
        },
      ],
    });

    const populatedAsset = await Asset.findById(asset._id)
      .populate("versions.uploadedBy", "firstName lastName email role")
      .populate("versions.reviewedBy", "firstName lastName email role");

    res.status(201).json({
      message: "Asset created successfully.",
      asset: populatedAsset,
    });
  } catch (error) {
    console.error("Create asset error:", error);

    res.status(500).json({
      message: "Failed to create asset.",
    });
  }
};

// ========================================
// GET ALL ASSETS FOR PROJECT
// ========================================
const getProjectAssets = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

    const assets = await Asset.find({
      project: projectId,
    })
      .populate("versions.uploadedBy", "firstName lastName email role")
      .populate("versions.reviewedBy", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.json({
      assets,
    });
  } catch (error) {
    console.error("Get project assets error:", error);

    res.status(500).json({
      message: "Failed to retrieve project assets.",
    });
  }
};

// ========================================
// GET SINGLE ASSET
// ========================================
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate("versions.uploadedBy", "firstName lastName email role")
      .populate("versions.reviewedBy", "firstName lastName email role");

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this asset.",
      });
    }

    res.json({
      asset,
    });
  } catch (error) {
    console.error("Get asset error:", error);

    res.status(500).json({
      message: "Failed to retrieve asset.",
    });
  }
};

// ========================================
// UPDATE ASSET INFORMATION
// ========================================
// This changes metadata only.
// It does NOT replace the image.
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only project managers can edit asset metadata.",
      });
    }

    if (req.body.title !== undefined) {
      asset.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      asset.description = req.body.description;
    }

    if (req.body.assetType !== undefined) {
      asset.assetType = req.body.assetType;
    }

    await asset.save();

    res.json({
      message: "Asset updated successfully.",
      asset,
    });
  } catch (error) {
    console.error("Update asset error:", error);

    res.status(500).json({
      message: "Failed to update asset.",
    });
  }
};

// ========================================
// UPLOAD NEW VERSION
// ========================================
const uploadNewVersion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "An image file is required.",
      });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this asset.",
      });
    }

    if (!["artist", "manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to upload a new version.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `projects/${asset.project}/assets/${asset._id}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      stream.end(req.file.buffer);
    });

    const nextVersion =
      asset.versions.length > 0
        ? Math.max(...asset.versions.map((version) => version.versionNumber)) +
          1
        : 1;

    asset.versions.push({
      versionNumber: nextVersion,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      status: "pending",
    });

    asset.currentVersion = nextVersion;

    await asset.save();

    const populatedAsset = await Asset.findById(asset._id)
      .populate("versions.uploadedBy", "firstName lastName email role")
      .populate("versions.reviewedBy", "firstName lastName email role");

    res.status(201).json({
      message: `Version ${nextVersion} uploaded successfully.`,
      asset: populatedAsset,
      versionNumber: nextVersion,
    });
  } catch (error) {
    console.error("Upload new version error:", error);

    res.status(500).json({
      message: "Failed to upload new asset version.",
    });
  }
};

// ========================================
// APPROVE VERSION
// ========================================
const approveVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can approve assets.",
      });
    }

    const version = asset.versions.find(
      (item) => item.versionNumber === Number(versionNumber),
    );

    if (!version) {
      return res.status(404).json({
        message: "Asset version not found.",
      });
    }

    version.status = "approved";
    version.reviewedBy = req.user._id;
    version.reviewedAt = new Date();
    version.reviewComment = "";

    await asset.save();

    res.json({
      message: `Version ${versionNumber} approved successfully.`,
      asset,
    });
  } catch (error) {
    console.error("Approve version error:", error);

    res.status(500).json({
      message: "Failed to approve asset version.",
    });
  }
};

// ========================================
// REJECT VERSION
// ========================================
const rejectVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can reject assets.",
      });
    }

    const version = asset.versions.find(
      (item) => item.versionNumber === Number(versionNumber),
    );

    if (!version) {
      return res.status(404).json({
        message: "Asset version not found.",
      });
    }

    version.status = "rejected";
    version.reviewedBy = req.user._id;
    version.reviewedAt = new Date();
    version.reviewComment = req.body.reviewComment || "";

    await asset.save();

    res.json({
      message: `Version ${versionNumber} rejected.`,
      asset,
    });
  } catch (error) {
    console.error("Reject version error:", error);

    res.status(500).json({
      message: "Failed to reject asset version.",
    });
  }
};

// ========================================
// DELETE ASSET
// ========================================
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found.",
      });
    }

    const project = await Project.findById(asset.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can delete assets.",
      });
    }

    // Delete all Cloudinary versions
    for (const version of asset.versions) {
      if (version.publicId) {
        try {
          await cloudinary.uploader.destroy(version.publicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary deletion error:", cloudinaryError);
        }
      }
    }

    await asset.deleteOne();

    res.json({
      message: "Asset and all of its versions were deleted.",
    });
  } catch (error) {
    console.error("Delete asset error:", error);

    res.status(500).json({
      message: "Failed to delete asset.",
    });
  }
};

// ========================================
// PROJECT PROGRESS
// ========================================
const getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (!userHasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

    const assets = await Asset.find({
      project: projectId,
    });

    const totalAssets = assets.length;

    let approvedAssets = 0;
    let pendingAssets = 0;
    let rejectedAssets = 0;

    assets.forEach((asset) => {
      const currentVersion = asset.versions.find(
        (version) => version.versionNumber === asset.currentVersion,
      );

      if (!currentVersion) {
        return;
      }

      if (currentVersion.status === "approved") {
        approvedAssets++;
      } else if (currentVersion.status === "rejected") {
        rejectedAssets++;
      } else {
        pendingAssets++;
      }
    });

    const progress =
      totalAssets === 0 ? 0 : Math.round((approvedAssets / totalAssets) * 100);

    res.json({
      projectId,
      totalAssets,
      approvedAssets,
      pendingAssets,
      rejectedAssets,
      progress,
    });
  } catch (error) {
    console.error("Project progress error:", error);

    res.status(500).json({
      message: "Failed to calculate project progress.",
    });
  }
};

module.exports = {
  createAsset,
  getProjectAssets,
  getAssetById,
  updateAsset,
  uploadNewVersion,
  approveVersion,
  rejectVersion,
  deleteAsset,
  getProjectProgress,
};
