import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login({
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-73px)] transition-colors duration-300">
      {/* Left Side: GIF Presentation */}
      <div className="hidden md:block md:w-3/5 lg:w-2/3 relative bg-[#0a0a0a] overflow-hidden border-r border-[#333333]">
        <img
          src="https://www.icegif.com/wp-content/uploads/2023/06/icegif-389.gif"
          alt="Spider-Verse Loop"
          className="w-full h-full object-cover opacity-70 mix-blend-lighten"
        />

        {/* Gradients fading into the form on the right */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#121212] via-[#121212]/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-90"></div>

        {/* Text Overlay aligned to the left */}
        <div className="absolute bottom-16 left-16 max-w-lg text-left z-10">
          <h2 className="text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            Continue Creating.
          </h2>
          <p className="text-gray-300 text-lg drop-shadow-md">
            Jump back into your timeline, review fresh renders, and push your
            frames to the absolute limit.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-2/5 lg:w-1/3 flex items-center justify-center p-8 bg-[#121212] transition-colors duration-300 z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">
              Sign in to Arian to continue.
            </p>
          </div>
          {error && (
            <div className="mb-4 rounded-md border border-[#ff477e]/30 bg-[#ff477e]/10 px-4 py-3 text-sm text-[#ff477e]">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-3 rounded-md focus:outline-none focus:border-[#9d4edd] transition-colors"
                placeholder="artist@studio.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333333] text-white px-4 py-3 rounded-md focus:outline-none focus:border-[#ff477e] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4 py-3 text-lg w-full shadow-lg shadow-[#9d4edd]/20 hover:shadow-[#9d4edd]/40 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Enter Studio"}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-gray-400">
            New to the studio?{" "}
            <Link
              to="/register"
              className="text-[#9d4edd] hover:text-white transition-colors font-bold"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
