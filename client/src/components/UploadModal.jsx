import { useState } from "react";
import { uploadNewVersion } from "../services/assetService";

const UploadModal = ({ isOpen, onClose, assetId, onUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!assetId) {
      setError("No asset was selected for this revision.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadNewVersion(assetId, file, note);

      setFile(null);
      setNote("");

      await onUploaded?.();

      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload revision.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setNote("");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-1 text-white">Upload Revision</h2>
        <p className="text-gray-400 text-sm mb-6">
          Submit a new version for review.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors relative
              ${dragActive ? "border-[#9d4edd] bg-[#9d4edd]/10" : "border-[#333333] hover:border-[#9d4edd] bg-[#121212]/50"}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
            />
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 transition-colors ${file ? "bg-[#10b981]/20" : "bg-[#1e1e1e]"}`}
            >
              {file ? "📄" : "📁"}
            </div>

            {file ? (
              <p className="text-sm font-semibold text-[#10b981] truncate w-full px-4">
                {file.name}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Any supported file type (max. 50MB)
                </p>
              </>
            )}
          </div>

          {error && <p className="text-sm text-[#ff477e]">{error}</p>}

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Asset Description
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter updated asset description..."
              className="bg-[#121212] border border-[#333333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#9d4edd] text-sm h-24 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-white text-sm font-medium px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className={`btn-primary py-2 px-6 font-bold ${
                !file || uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;