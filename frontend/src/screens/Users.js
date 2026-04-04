import React, { useEffect, useState } from "react";
import { API, getAuthHeaders } from "config";

export default function Users({ setCurrentScreen }) {

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "cashier"
  });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  // =========================
  // 🔐 ADMIN GUARD
  // =========================
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      setCurrentScreen && setCurrentScreen("dashboard");
    }
  }, [currentUser, setCurrentScreen]);

  // =========================
  // 🌐 API HELPER
  // =========================
  const apiRequest = async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        ...options
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }

      return data;

    } catch (err) {
      throw err;
    }
  };

  // =========================
  // 📥 FETCH USERS
  // =========================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`${API}/users/`);
      setUsers(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // 🧹 RESET FORM
  // =========================
  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      role: "cashier"
    });
    setEditingId(null);
  };

  // =========================
  // 💾 CREATE / UPDATE
  // =========================
  const handleSubmit = async () => {

    if (actionLoading) return;

    setError(null);
    setSuccess(null);

    if (!form.username.trim()) {
      setError("Username required");
      return;
    }

    if (!editingId && form.password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    const url = editingId
      ? `${API}/users/${editingId}`
      : `${API}/users/`;

    const method = editingId ? "PUT" : "POST";

    setActionLoading(true);

    try {
      await apiRequest(url, {
        method,
        body: JSON.stringify(form)
      });

      setSuccess(editingId ? "User updated" : "User created");

      resetForm();
      fetchUsers();

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // ✏️ EDIT
  // =========================
  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: "",
      role: user.role
    });
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
      await apiRequest(`${API}/users/${id}`, {
        method: "DELETE"
      });

      setSuccess("User deleted");
      fetchUsers();

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // UI
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

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* FORM */}
      <div style={styles.card}>
        <h3>{editingId ? "Edit User" : "Create User"}</h3>

        <div style={styles.form}>

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={styles.input}
            disabled={actionLoading}
          />

          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={styles.input}
            disabled={actionLoading}
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
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
                <tr key={u.id}>
                  <td>{u.id}</td>

                  <td>
                    {u.username}
                    {isCurrentUser && " (You)"}
                  </td>

                  <td>{u.role}</td>

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