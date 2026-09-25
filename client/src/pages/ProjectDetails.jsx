import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProjectById } from "../services/projectService";

import { getProjectAssets, getProjectProgress } from "../services/assetService";

import { useAuth } from "../context/AuthContext";

import AssetCard from "../components/AssetCard";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);

  const [assetForm, setAssetForm] = useState({
    title: "",
    description: "",
    assetType: "image",
    image: null,
  });

  const [uploading, setUploading] = useState(false);

  const handleAssetChange = (e) => {
    const { name, value, files } = e.target;

    setAssetForm({
      ...assetForm,
      [name]: files ? files[0] : value,
    });
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();

    if (!assetForm.image) {
      setError("Please select an image.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await createAsset(projectId, assetForm);

      setAssetForm({
        title: "",
        description: "",
        assetType: "image",
        image: null,
      });

      setShowUpload(false);

      await loadProject();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload asset.");
    } finally {
      setUploading(false);
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);

      const [projectData, assetData, progressData] = await Promise.all([
        getProjectById(projectId),
        getProjectAssets(projectId),
        getProjectProgress(projectId),
      ]);

      setProject(projectData.project);
      setAssets(assetData.assets || []);
      setProgress(progressData);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <div>
      <Link to="/projects">← Back to Projects</Link>

      <h1>{project.name}</h1>

      <p>{project.description}</p>

      <p>Status: {project.status}</p>

      <h2>Project Progress</h2>

      {progress && (
        <div>
          <p>
            Completed: {progress.approvedAssets ?? 0} /{" "}
            {progress.totalAssets ?? 0}
          </p>

          <progress value={progress.progress ?? 0} max="100" />

          <p>{progress.progress ?? 0}%</p>
        </div>
      )}

      <h2>Members</h2>

      {project.members?.map((member) => (
        <div key={member.user?._id}>
          {member.user?.firstName} {member.user?.lastName} — {member.role}
        </div>
      ))}
      {(user?.role === "artist" ||
        user?.role === "manager" ||
        user?.role === "admin") && (
        <>
          <button onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? "Cancel" : "Upload Asset"}
          </button>

          {showUpload && (
            <form onSubmit={handleCreateAsset}>
              <h3>Upload Asset</h3>

              <input
                name="title"
                placeholder="Asset title"
                value={assetForm.title}
                onChange={handleAssetChange}
                required
              />

              <textarea
                name="description"
                placeholder="Description"
                value={assetForm.description}
                onChange={handleAssetChange}
              />

              <select
                name="assetType"
                value={assetForm.assetType}
                onChange={handleAssetChange}
              >
                <option value="image">Image</option>

                <option value="design">Design</option>

                <option value="document">Document</option>

                <option value="video">Video</option>

                <option value="other">Other</option>
              </select>

              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleAssetChange}
                required
              />

              <button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          )}
        </>
      )}
      <h2>Assets</h2>

      {assets.length === 0 ? (
        <p>No assets yet.</p>
      ) : (
        assets.map((asset) => (
          <AssetCard key={asset._id} asset={asset} onUpdated={loadProject} />
        ))
      )}

      <p>Current user: {user?.role}</p>
    </div>
  );
};

export default ProjectDetails;
