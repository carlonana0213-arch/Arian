import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome to Arian</h1>

      <p>
        Logged in as: {user?.firstName} {user?.lastName}
      </p>

      <p>Role: {user?.role}</p>

      <nav>
        <Link to="/projects">Projects</Link>
      </nav>

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
