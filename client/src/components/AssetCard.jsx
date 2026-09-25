import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CommentSection from "./CommentSection";
import {
  uploadNewVersion,
  approveVersion,
  rejectVersion,
} from "../services/assetService";

const AssetCard = ({ asset, onUpdated }) => {
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");

  const currentVersion = asset.versions?.find(
    (version) => version.versionNumber === asset.currentVersion,
  );

  const isManager = user?.role === "manager" || user?.role === "admin";

  const handleUploadVersion = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadNewVersion(asset._id, selectedFile);

      setSelectedFile(null);

      await onUpdated();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to upload new version.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setReviewing(true);
      setError("");

      await approveVersion(asset._id, asset.currentVersion, reviewComment);

      setReviewComment("");

      await onUpdated();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to approve version.");
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewComment.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    try {
      setReviewing(true);
      setError("");

      await rejectVersion(asset._id, asset.currentVersion, reviewComment);

      setReviewComment("");

      await onUpdated();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reject version.");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "8px",
      }}
    >
      <h3>{asset.title}</h3>

      <p>{asset.description || "No description provided."}</p>

      <p>
        <strong>Current Version:</strong> v{asset.currentVersion}
      </p>

      {currentVersion && (
        <>
          <p>
            <strong>Status:</strong> {currentVersion.status}
          </p>

          {currentVersion.fileUrl && (
            <div>
              <img
                src={currentVersion.fileUrl}
                alt={asset.title}
                style={{
                  maxWidth: "400px",
                  maxHeight: "300px",
                  objectFit: "contain",
                }}
              />
            </div>
          )}
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <hr />

      <h4>Version History</h4>

      {asset.versions?.map((version) => (
        <div
          key={version.versionNumber}
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <strong>v{version.versionNumber}</strong> — {version.status}
          {version.reviewComment && <p>Review: {version.reviewComment}</p>}
        </div>
      ))}

      <hr />

      <h4>Upload New Version</h4>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
      />

      <br />
      <br />

      <button
        onClick={handleUploadVersion}
        disabled={uploading || !selectedFile}
      >
        {uploading ? "Uploading..." : "Upload New Version"}
      </button>

      {isManager && currentVersion?.status === "pending" && (
        <>
          <hr />
          <CommentSection assetId={asset._id} />
          <h4>Review Asset</h4>
          <textarea
            placeholder="Review comment"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <br />
          <br />
          <button onClick={handleApprove} disabled={reviewing}>
            {reviewing ? "Processing..." : "Approve"}
          </button>{" "}
          <button onClick={handleReject} disabled={reviewing}>
            {reviewing ? "Processing..." : "Reject"}
          </button>
        </>
      )}
    </div>
  );
};

export default AssetCard;
