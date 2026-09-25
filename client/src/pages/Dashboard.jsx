import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Arian Dashboard</h1>

      <p>
        Welcome, {user?.firstName} {user?.lastName}
      </p>

      <p>
        Role: <strong>{user?.role}</strong>
      </p>

      <div>
        <Link to="/projects">
          <button>View Projects</button>
        </Link>
      </div>

      <br />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
