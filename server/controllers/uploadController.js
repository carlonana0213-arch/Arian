const Asset = require("../models/Asset");
const cloudinary = require("../config/cloudinary");
const path = require("path");

const uploadAsset = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assetType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const ext = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, ext);
    
    // Check if it's a document/archive or standard image/media
    const mimetype = req.file.mimetype;
    const isRaw = mimetype.includes("pdf") || 
                  mimetype.includes("word") || 
                  mimetype.includes("document") || 
                  mimetype.includes("sheet") || 
                  mimetype.includes("zip") ||
                  mimetype.includes("text");

    const options = {
      folder: `projects/${projectId}`,
      resource_type: isRaw ? "raw" : "auto",
      public_id: `${Date.now()}_${baseName}${isRaw ? ext : ""}`,
    };

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
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
      description,
      assetType: assetType || "other",
      fileUrl: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user._id,
      status: "pending",
    });

    res.status(201).json({
      message: "Asset uploaded successfully",
      asset,
    });
  } catch (error) {
    console.error("Upload asset error details:", error);

    res.status(500).json({
      message: "Failed to upload asset",
      error: error.message,
    });
  }
};

module.exports = {
  uploadAsset,
};