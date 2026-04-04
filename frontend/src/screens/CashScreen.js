import React, { useState, useEffect } from "react";
import { authFetch } from "../core/api/apiClient";

export default function CashScreen() {

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("in");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const formatKES = (val) =>
    "KES " + Number(val || 0).toLocaleString();

  // =========================
  // 📥 LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      setError(null);

      const res = await authFetch("/ledger/cash");
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to load cash data");
        return;
      }

      setHistory(data.history || []);
      setBalance(data.balance || 0);

    } catch (err) {
      console.error(err);
      setError("Server error while loading cash data");
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // 📤 SUBMIT ENTRY
  // =========================
  const handleSubmit = async () => {

    if (loading) return;

    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter valid amount");
      return;
    }

    if (!reason.trim()) {
      setError("Enter reason");
      return;
    }

    if (type === "out" && parsedAmount > balance) {
      setError("Insufficient cash balance");
      return;
    }

    // 🔥 CONFIRM CASH OUT (FIXED)
    if (type === "out") {
      const confirmAction = window.confirm(
        `Withdraw ${formatKES(parsedAmount)} ?`
      );
      if (!confirmAction) return;
    }

    setLoading(true);

    try {
      const res = await authFetch("/ledger/cash", {
        method: "POST",
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          reason
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to record entry");
        return;
      }

      // ✅ SAFE OFFLINE CHECK
      if (data?.message && data.message.includes("offline")) {
        setSuccess("Saved offline. Will sync automatically.");
      } else {
        setSuccess("✅ Recorded successfully");
      }

      setAmount("");
      setReason("");

      await loadData();

    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 📊 RUNNING BALANCE
  // =========================
  let runningBalance = balance;

  const computedHistory = [...history]
    .reverse()
    .map(item => {
      if (item.type === "in") {
        runningBalance -= item.amount;
      } else {
        runningBalance += item.amount;
      }

      return {
        ...item,
        after:
          item.type === "in"
            ? runningBalance + item.amount
            : runningBalance - item.amount
      };
    })
    .reverse();

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>

      <h2>💰 Cash Control</h2>

      {/* BALANCE */}
      <div style={styles.balance}>
        Balance: {formatKES(balance)}
      </div>

      {/* ALERTS */}
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* FORM */}
      <div style={styles.card}>
        <h3>New Entry</h3>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={styles.input}
        >
          <option value="in">Cash In</option>
          <option value="out">Cash Out</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.button,
            background: loading ? "#ccc" : "#007bff"
          }}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </div>

      {/* HISTORY */}
      <div>
        <h3>Recent Transactions</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Balance After</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {computedHistory.length === 0 && (
                <tr>
                  <td colSpan="5">No records</td>
                </tr>
              )}

              {computedHistory.map((item, i) => (
                <tr key={i}>
                  <td style={{
                    color: item.type === "in" ? "green" : "red",
                    fontWeight: "bold"
                  }}>
                    {item.type === "in" ? "IN" : "OUT"}
                  </td>

                  <td>{formatKES(item.amount)}</td>
                  <td>{item.reason}</td>

                  <td style={{ fontWeight: "bold" }}>
                    {formatKES(item.after)}
                  </td>

                  <td>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {

  balance: {
    background: "#111",
    color: "#0f0",
    padding: "15px",
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: "bold",
    borderRadius: "8px"
  },

  card: {
    border: "1px solid #ddd",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "#fff"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px"
  },

  button: {
    width: "100%",
    padding: "14px",
    color: "white",
    border: "none",
    fontSize: "16px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px"
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px"
  }
};