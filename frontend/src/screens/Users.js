import React, { useEffect, useState } from "react";
import { API, getAuthHeaders } from "config";

export default function Users({ setCurrentScreen }) {

  const [users, setUsers] = useState([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  console.log("👤 CURRENT USER:", currentUser);

  // =========================
  // 🔐 ADMIN GUARD
  // =========================
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      console.log("⛔ Not admin, redirecting...");
      setCurrentScreen && setCurrentScreen("dashboard");
    }
  }, [currentUser, setCurrentScreen]);

  // =========================
  // 📥 FETCH USERS
  // =========================
  const fetchUsers = async () => {
    console.log("🔥 FETCH USERS CALLED");

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      console.log("🔑 TOKEN:", token);

      const res = await fetch(`${API}/users`, {
        headers: getAuthHeaders()
      });

      console.log("📡 RESPONSE STATUS:", res.status);

      const data = await res.json();
      console.log("📦 RESPONSE DATA:", data);

      if (!res.ok) {
        setError("Failed to load users");
        return;
      }

      setUsers(data);

    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔥 USE EFFECT RUNNING");
    fetchUsers();
  }, []);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("cashier");
    setEditingId(null);
  };

  // =========================
  // 💾 CREATE / UPDATE
  // =========================
  const handleSubmit = async () => {

    if (actionLoading) return;

    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError("Username required");
      return;
    }

    if (!editingId && password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    const url = editingId
      ? `${API}/users/${editingId}`
      : `${API}/users`;

    const method = editingId ? "PUT" : "POST";

    setActionLoading(true);

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password, role })
      });

      if (!res.ok) {
        setError("Operation failed");
        return;
      }

      setSuccess(editingId ? "User updated" : "User created");

      resetForm();
      fetchUsers();

    } catch {
      setError("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // ✏️ EDIT
  // =========================
  const handleEdit = (user) => {
    setUsername(user.username);
    setRole(user.role);
    setPassword("");
    setEditingId(user.id);
  };

  // =========================
  // 🗑️ DELETE
  // =========================
  const handleDelete = async (id) => {

    if (actionLoading) return;

    if (id === currentUser?.id) {
      setError("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Delete this user?")) return;

    setActionLoading(true);

    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        setError("Delete failed");
        return;
      }

      setSuccess("User deleted");
      fetchUsers();

    } catch {
      setError("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // 🧠 UI (FIXED ERROR HANDLING)
  // =========================
  if (loading) return <p style={styles.msg}>Loading users...</p>;

  return (
    <div style={styles.page}>

      <button
        onClick={() => setCurrentScreen && setCurrentScreen("dashboard")}
        style={styles.backBtn}
      >
        ← Back
      </button>

      <h2 style={styles.title}>Users Management</h2>

      {/* ✅ ERROR now does NOT break UI */}
      {error && <div style={styles.error}>{error}</div>}

      {success && <div style={styles.success}>{success}</div>}

      {/* FORM */}
      <div style={styles.card}>
        <h3>{editingId ? "Edit User" : "Create User"}</h3>

        <div style={styles.form}>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            disabled={actionLoading}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={actionLoading}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.input}
            disabled={actionLoading}
          >
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={handleSubmit}
            style={styles.primaryBtn}
            disabled={actionLoading}
          >
            {actionLoading
              ? "Saving..."
              : editingId ? "Update" : "Create"}
          </button>

          {editingId && (
            <button onClick={resetForm} style={styles.grayBtn}>
              Cancel
            </button>
          )}

        </div>
      </div>

      {/* TABLE */}
      <div style={styles.card}>
        <h3>Users List</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => {

              const isCurrentUser = u.id === currentUser?.id;

              return (
                <tr
                  key={u.id}
                  style={{
                    background: isCurrentUser ? "#fef9c3" : "transparent"
                  }}
                >
                  <td>{u.id}</td>

                  <td>
                    {u.username}
                    {isCurrentUser && " (You)"}
                  </td>

                  <td style={{
                    fontWeight: "bold",
                    color: u.role === "admin" ? "#2563eb" : "#111"
                  }}>
                    {u.role}
                  </td>

                  <td>
                    <button
                      onClick={() => handleEdit(u)}
                      style={styles.grayBtn}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(u.id)}
                      style={styles.dangerBtn}
                      disabled={isCurrentUser}
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

const styles = {
  page: { maxWidth: 1000, margin: "0 auto" },
  title: { color: "#FACC15" },
  card: {
    background: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #eee",
    marginTop: 20
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
    gap: 10
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10
  },
  primaryBtn: {
    background: "#FACC15",
    border: "none",
    padding: 10,
    borderRadius: 8,
    cursor: "pointer"
  },
  grayBtn: {
    background: "#eee",
    border: "none",
    padding: 8,
    marginRight: 5,
    borderRadius: 6,
    cursor: "pointer"
  },
  dangerBtn: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer"
  },
  backBtn: {
    marginBottom: 10,
    padding: "6px 12px",
    border: "none",
    background: "#FACC15",
    borderRadius: 6,
    cursor: "pointer"
  },
  msg: { padding: 20 },
  error: {
    padding: 20,
    color: "#991b1b"
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: 10,
    borderRadius: 6,
    marginTop: 10
  }
};
