import React, { useState } from "react";
import { API } from "config";

export default function Login({ onLoginSuccess }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {

    if (loading) return;

    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Enter username and password");
      return;
    }

    try {
      setLoading(true);

      // ✅ FIX: Use form-urlencoded
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      // =========================
      // 🔐 STORE AUTH DATA
      // =========================
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      localStorage.setItem("user", JSON.stringify(data));

      // =========================
      // 🚀 SUCCESS CALLBACK
      // =========================
      onLoginSuccess(data);

    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={{ marginBottom: 20 }}>Phoenix POS</h2>

        {/* ERROR */}
        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          disabled={loading}
          autoFocus
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {

  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#F3F4F6"
  },

  card: {
    background: "#FFFFFF",
    padding: "30px",
    borderRadius: "12px",
    border: "1px solid #eee",
    width: "320px",
    textAlign: "center"
  },

  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    outline: "none"
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#FACC15",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 10
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px"
  }
};
