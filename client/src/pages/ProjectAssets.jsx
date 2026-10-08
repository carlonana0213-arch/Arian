import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectById } from "../services/projectService";
import { getProjectAssets, deleteAsset } from "../services/assetService";
import CreateAssetModal from "../components/CreateAssetModal";
import api from "../services/api";

const ProjectAssets = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isArtist = user?.role === "artist";

  const canManageAssets = isManager || isArtist;

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [projectResponse, assetResponse] = await Promise.all([
        getProjectById(projectId),
        getProjectAssets(projectId),
      ]);

      setProject(projectResponse.project);
      setAssets(assetResponse.assets || []);
    } catch (error) {
      console.error("Failed to load project assets:", error);

      setError(
        error.response?.data?.message || "Failed to load project assets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [projectId]);

  const getTaskStats = async (assetId) => {
    try {
      const response = await api.get(`/tasks/asset/${assetId}`);

      const tasks = response.data.tasks || [];

      const total = tasks.length;
      const completed = tasks.filter((task) => task.completed).length;

      const percentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        total,
        completed,
        percentage,
      };
    } catch (error) {
      console.error(`Failed to load tasks for asset ${assetId}:`, error);

      return {
        total: 0,
        completed: 0,
        percentage: 0,
      };
    }
  };

  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    const loadTaskStats = async () => {
      if (!assets.length) {
        setTaskStats({});
        return;
      }

      const entries = await Promise.all(
        assets.map(async (asset) => {
          const stats = await getTaskStats(asset._id);

          return [asset._id, stats];
        }),
      );

      setTaskStats(Object.fromEntries(entries));
    };

    loadTaskStats();
  }, [assets]);

  const handleDeleteAsset = async (assetId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this asset and all of its versions?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAssetId(assetId);

      await deleteAsset(assetId);

      await loadPage();
    } catch (error) {
      console.error("Failed to delete asset:", error);

      setError(error.response?.data?.message || "Failed to delete asset.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <p className="text-gray-400">Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <p className="text-[#ff477e]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="flex justify-between items-start mb-8 pb-6 border-b border-[#333333]">
        <div>
          <Link
            to="/projects"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to Projects
          </Link>

          <h1 className="text-3xl font-bold text-white mt-4">
            {project?.name || "Project"}
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            Manage and review project assets.
          </p>
        </div>

        {canManageAssets && (
          <button
            onClick={() => setIsCreateAssetModalOpen(true)}
            className="btn-primary py-2 px-6"
          >
            + Add Asset
          </button>
        )}
      </header>

      {assets.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <h2 className="text-xl font-semibold text-white">No assets yet</h2>

          <p className="text-sm text-gray-500 mt-2">
            This project does not have any assets yet.
          </p>

          {canManageAssets && (
            <button
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="btn-primary mt-6 px-6 py-2"
            >
              + Add First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const stats = taskStats[asset._id] || {
              total: 0,
              completed: 0,
              percentage: 0,
            };

            const currentVersion = asset.versions?.find(
              (version) => version.versionNumber === asset.currentVersion,
            );

            return (
              <div
                key={asset._id}
                className="glass-panel overflow-hidden group hover:border-[#9d4edd] transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/project/${projectId}/asset/${asset._id}`)
                  }
                  className="w-full text-left"
                >
                  <div className="aspect-video bg-[#121212] overflow-hidden">
                    {currentVersion?.fileUrl ? (
                      <img
                        src={currentVersion.fileUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-lg font-bold text-white group-hover:text-[#9d4edd] transition-colors">
                        {asset.title}
                      </h2>

                      <span className="text-xs px-2 py-1 rounded bg-[#121212] border border-[#333333] text-gray-400 whitespace-nowrap">
                        v{asset.currentVersion}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {asset.assetType}
                    </p>

                    <div className="mt-6">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Tasks</span>

                        <span className="text-white font-mono">
                          {stats.completed} / {stats.total}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-[#121212] border border-[#333333] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9d4edd] to-[#ff477e] transition-all duration-500"
                          style={{
                            width: `${stats.percentage}%`,
                          }}
                        />
                      </div>

                      <div className="text-right mt-2 text-xs text-gray-500">
                        {stats.percentage}% complete
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#333333] flex justify-between">
                      <span className="text-xs text-gray-500">
                        Current Version
                      </span>

                      <span className="text-xs text-white font-mono">
                        v{asset.currentVersion}
                      </span>
                    </div>
                  </div>
                </button>

                {isManager && (
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset._id)}
                      disabled={deletingAssetId === asset._id}
                      className="w-full py-2 text-xs font-semibold border border-[#ff477e] text-[#ff477e] rounded-md hover:bg-[#ff477e] hover:text-white transition-colors disabled:opacity-50"
                    >
                      {deletingAssetId === asset._id
                        ? "Deleting..."
                        : "Remove Asset"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateAssetModal
        isOpen={isCreateAssetModalOpen}
        onClose={() => setIsCreateAssetModalOpen(false)}
        projectId={projectId}
        onCreated={loadPage}
      />
    </div>
  );
};

export default ProjectAssets;
