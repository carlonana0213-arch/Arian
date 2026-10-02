import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("artist");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await register({
        firstName,
        lastName,
        email,
        password,
        role,
      });

      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-73px)]">
      <div className="w-full md:w-2/5 lg:w-1/3 flex items-center justify-center p-8 bg-[#121212]">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-2 text-white">
            Join the Studio
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Create your Arian account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">
                  First Name
                </label>

                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-2.5 rounded-md focus:outline-none focus:border-[#9d4edd]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Last Name
                </label>

                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-2.5 rounded-md focus:outline-none focus:border-[#9d4edd]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-2.5 rounded-md focus:outline-none focus:border-[#9d4edd] transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-2.5 rounded-md focus:outline-none focus:border-[#ff477e] transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Studio Role
              </label>
              <select
                className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-3 rounded-md focus:outline-none focus:border-[#ffd166] transition-colors appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="artist">Artist / Animator</option>
                <option value="client">Reviewer / Client</option>
                <option value="manager">Project Manager</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary mt-4 py-3 text-lg w-full"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-400">
            Already in the studio?{" "}
            <Link
              to="/login"
              className="text-[#9d4edd] hover:text-white transition-colors font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block md:w-3/5 lg:w-2/3 relative bg-black overflow-hidden border-l border-[#333333]">
        <img
          src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/33f645111616075.60059341f0147.gif"
          alt="Creative Process"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-90"></div>
        <div className="absolute bottom-16 right-12 max-w-lg text-right">
          <h2 className="text-4xl font-bold text-white mb-3">
            Streamline the Review Process
          </h2>
          <p className="text-gray-300 text-lg">
            Say goodbye to lost email threads. Frame-accurate comments, clear
            versioning, and instant approvals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
