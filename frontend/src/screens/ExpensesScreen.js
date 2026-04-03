import { useState } from "react";
import { API, getAuthHeaders } from "config";

export default function ExpensesScreen() {

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const formatKES = (val) =>
    "KES " + Number(val || 0).toLocaleString();

  const submit = async () => {

    if (loading) return;

    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter valid amount");
      return;
    }

    if (!description.trim()) {
      setError("Enter description");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/ledger/expense`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: parsedAmount,
          description,
          category
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to record expense");
        return;
      }

      setSuccess("✅ Expense recorded successfully");

      setAmount("");
      setDescription("");

    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      <h2>💸 Record Expense</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.card}>

        <label>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={styles.input}
        >
          <option value="fuel">⛽ Fuel</option>
          <option value="rent">🏠 Rent</option>
          <option value="stock">📦 Stock</option>
          <option value="general">🧾 General</option>
        </select>

        <label>Amount</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={styles.input}
        />

        <label>Description</label>
        <input
          placeholder="What was this expense for?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={styles.input}
        />

        {amount && (
          <div style={styles.preview}>
            Amount: {formatKES(amount)}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            ...styles.button,
            background: loading ? "#ccc" : "#dc2626"
          }}
        >
          {loading ? "Saving..." : "Save Expense"}
        </button>

      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  container: {
    padding: 20,
    maxWidth: 500
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc"
  },

  button: {
    marginTop: 10,
    padding: 12,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold"
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6
  },

  preview: {
    background: "#f9fafb",
    padding: 10,
    borderRadius: 6,
    fontWeight: "bold"
  }
};
