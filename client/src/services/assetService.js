import api from "./api";

export const getProjectAssets = async (projectId) => {
  const response = await api.get(`/assets/project/${projectId}`);

  return response.data;
};

export const getProjectProgress = async (projectId) => {
  const response = await api.get(`/assets/project/${projectId}/progress`);

  return response.data;
};

export const getAssetById = async (assetId) => {
  const response = await api.get(`/assets/${assetId}`);
  return response.data;
};

export const createAsset = async (projectId, assetData) => {
  const formData = new FormData();

  formData.append("title", assetData.title);
  formData.append("description", assetData.description || "");
  formData.append("assetType", assetData.assetType || "image");
  formData.append("image", assetData.image);

  const response = await api.post(`/assets/project/${projectId}`, formData);

  return response.data;
};

export const uploadNewVersion = async (assetId, image) => {
  const formData = new FormData();

  formData.append("image", image);

  const response = await api.post(`/assets/${assetId}/versions`, formData);

  return response.data;
};

export const approveVersion = async (
  assetId,
  versionNumber,
  reviewComment = "",
) => {
  const response = await api.patch(
    `/assets/${assetId}/versions/${versionNumber}/approve`,
    {
      reviewComment,
    },
  );

  return response.data;
};

export const rejectVersion = async (assetId, versionNumber, reviewComment) => {
  const response = await api.patch(
    `/assets/${assetId}/versions/${versionNumber}/reject`,
    {
      reviewComment,
    },
  );

  return response.data;
};

export const updateAsset = async (assetId, assetData) => {
  const response = await api.patch(`/assets/${assetId}`, assetData);

  return response.data;
};

export const deleteAsset = async (assetId) => {
  const response = await api.delete(`/assets/${assetId}`);

  return response.data;
};
