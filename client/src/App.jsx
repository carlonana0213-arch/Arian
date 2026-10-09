import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // <-- ADD THIS
import Navbar from "./components/Navbar";
import MessagingWidget from "./components/MessagingWidget";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import ProjectAssets from "./pages/ProjectAssets";
import Admin from "./pages/Admin"; // <-- ADD THIS
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {" "}
        {/* <-- ADD WRAPPER HERE */}
        <Router>
          <div className="min-h-screen flex flex-col bg-[#0a0a0a] transition-colors duration-300">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                }
              />

              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />

              <Route
                path="/project/:id"
                element={
                  <PrivateRoute>
                    <ProjectAssets />
                  </PrivateRoute>
                }
              />

              <Route
                path="/project/:id/asset/:assetId"
                element={
                  <PrivateRoute>
                    <ProjectDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project/:id"
                element={
                  <PrivateRoute>
                    <ProjectDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />
            </Routes>
            <MessagingWidget />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
