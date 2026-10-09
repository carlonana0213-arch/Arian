import { useState } from "react";
import { createAsset } from "../services/assetService";

const CreateAssetModal = ({ isOpen, onClose, projectId, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState("image");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Asset title is required.");
      return;
    }

    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await createAsset(projectId, {
        title: title.trim(),
        description,
        assetType,
        file: file, // Matches the updated assetService
      });

      setTitle("");
      setDescription("");
      setAssetType("image");
      setFile(null);

      await onCreated?.();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create asset.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploading) return;

    setTitle("");
    setDescription("");
    setAssetType("image");
    setFile(null);
    setError("");

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md p-6 relative">
        <button
          onClick={handleCancel}
          disabled={uploading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-white">Upload New Asset</h2>

        <p className="text-gray-400 text-sm mb-6">
          Create a new asset for this project.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Asset Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd]"
              placeholder="e.g. Character Concept"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] h-24 resize-none"
              placeholder="Describe this asset..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Asset Type
            </label>

            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full mt-1 bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd]"
            >
              <option value="image">Image</option>
              <option value="design">Design</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              File
            </label>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full mt-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1e1e1e] file:text-white hover:file:bg-[#252525] cursor-pointer"
            />
          </div>

          {error && <p className="text-sm text-[#ff477e]">{error}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="text-gray-400 hover:text-white text-sm font-medium px-4"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="btn-primary py-2 px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssetModal;