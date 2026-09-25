import { useEffect, useState } from "react";

import {
  getAssetComments,
  createComment,
  deleteComment,
} from "../services/commentService";

import { useAuth } from "../context/AuthContext";

const CommentSection = ({ assetId }) => {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadComments = async () => {
    try {
      const data = await getAssetComments(assetId);

      setComments(data.comments || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [assetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    try {
      await createComment(assetId, text);

      setText("");

      await loadComments();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add comment.");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);

      await loadComments();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete comment.");
    }
  };

  if (loading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div>
      <h4>Comments</h4>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment._id}
            style={{
              borderBottom: "1px solid #eee",
              padding: "10px 0",
            }}
          >
            <strong>
              {comment.user?.firstName} {comment.user?.lastName}
            </strong>

            <small> ({comment.user?.role})</small>

            <p>{comment.text}</p>

            {comment.user?._id === user?._id && (
              <button onClick={() => handleDelete(comment._id)}>Delete</button>
            )}
          </div>
        ))
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <button type="submit">Comment</button>
      </form>
    </div>
  );
};

export default CommentSection;
