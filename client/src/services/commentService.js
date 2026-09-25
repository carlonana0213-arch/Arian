import api from "./api";

export const getAssetComments = async (assetId) => {
  const response = await api.get(`/comments/asset/${assetId}`);

  return response.data;
};

export const createComment = async (assetId, text) => {
  const response = await api.post(`/comments/asset/${assetId}`, {
    text,
  });

  return response.data;
};

export const updateComment = async (commentId, text) => {
  const response = await api.patch(`/comments/${commentId}`, {
    text,
  });

  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);

  return response.data;
};
