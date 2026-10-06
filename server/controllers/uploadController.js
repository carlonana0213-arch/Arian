const Asset = require("../models/Asset");
const cloudinary = require("../config/cloudinary");

const uploadAsset = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `projects/${projectId}`,
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

      description,

      assetType: "image",

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
    console.error(error);

    res.status(500).json({
      message: "Failed to upload asset",
    });
  }
};

module.exports = {
  uploadAsset,
};
