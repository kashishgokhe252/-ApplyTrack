
import { useState } from "react";
import "./App.css";

const AUTH_API = "http://localhost:5000/api/auth";

function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/login" : "/signup";

      const payload =
        mode === "login"
          ? {
              email: form.email.trim(),
              password: form.password,
            }
          : {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            };

      const response = await fetch(`${AUTH_API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Authentication failed"
        );
      }

      if (!data.token || !data.user) {
        throw new Error("Token or user details were not received.");
      }

      localStorage.setItem("applytrack_token", data.token);
      localStorage.setItem(
        "applytrack_user",
        JSON.stringify(data.user)
      );

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>ApplyTrack<span>.</span></h1>
          <p>Track your journey towards your dream job.</p>
        </div>

        <div className="auth-heading">
          <h2>
            {mode === "login" ? "Welcome Back!" : "Create Account"}
          </h2>
          <p>
            {mode === "login"
              ? "Login to continue to your dashboard."
              : "Sign up to start tracking your applications."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode}>
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>

        <p className="auth-footer">
          ApplyTrack · Your job search, organized.
        </p>
      </div>
    </div>
  );
}

export default Auth;
