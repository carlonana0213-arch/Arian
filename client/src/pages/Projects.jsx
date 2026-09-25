import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, createProject } from "../services/projectService";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    status: "planning",
  });

  const loadProjects = async () => {
    try {
      setLoading(true);

      const data = await getProjects();

      setProjects(data.projects || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await createProject(form);

      setForm({
        name: "",
        description: "",
        startDate: "",
        deadline: "",
        status: "planning",
      });

      setShowCreate(false);

      await loadProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create project.");
    }
  };

  const canCreate = user?.role === "manager" || user?.role === "admin";

  if (loading) {
    return <p>Loading projects...</p>;
  }

  return (
    <div>
      <h1>Projects</h1>

      <p>
        Logged in as {user?.firstName} ({user?.role})
      </p>

      {canCreate && (
        <button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Project"}
        </button>
      )}

      {error && <p>{error}</p>}

      {showCreate && (
        <form onSubmit={handleCreate}>
          <h2>Create Project</h2>

          <input
            name="name"
            placeholder="Project name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <label>
            Start Date
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Deadline
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
            />
          </label>

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <button type="submit">Create</button>
        </form>
      )}

      <hr />

      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        projects.map((project) => (
          <div key={project._id}>
            <h2>{project.name}</h2>

            <p>{project.description || "No description"}</p>

            <p>Status: {project.status}</p>

            <p>
              Manager: {project.manager?.firstName} {project.manager?.lastName}
            </p>

            <Link to={`/projects/${project._id}`}>View Project</Link>
          </div>
        ))
      )}
    </div>
  );
};

export default Projects;
