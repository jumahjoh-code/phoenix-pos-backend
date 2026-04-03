import React, { useState, useEffect } from "react";
import { API } from "../config";

export default function MpesaAgentScreen() {

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const formatKES = (val) =>
    "KES " + Number(val || 0).toLocaleString();

  useEffect(() => {
    fetchBalances();
    fetchTransactions();
  }, []);

  const fetchBalances = async () => {
    try {
      const res = await fetch(`${API}/ledger/summary`);
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error("Balance error:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API}/ledger`);
      const data = await res.json();

      const safeData = Array.isArray(data) ? data : [];

      const filtered = safeData.filter(
        (t) => t.type === "mpesa_deposit" || t.type === "mpesa_withdraw"
      );

      setTransactions(filtered.slice(0, 10));

    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  const handleTransaction = async (type) => {

    if (loading) return;

    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);

    if (!phone || phone.length < 10) {
      setError("Enter valid phone number");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter valid amount");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/ledger/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || data.detail || "Transaction failed");
        return;
      }

      setSuccess("✅ Transaction successful");

      setAmount("");
      setPhone("");

      fetchBalances();
      fetchTransactions();

    } catch (err) {
      console.error(err);
      setError("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>

      <h2>📱 M-Pesa Agent</h2>

      <div style={balanceBox}>
        <div>
          💵 Cash  
          <div style={balanceValue}>{formatKES(ledger?.cash_balance)}</div>
        </div>

        <div>
          📲 Float  
          <div style={balanceValue}>{formatKES(ledger?.mpesa_agent_balance)}</div>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {success && <div style={successBox}>{success}</div>}

      <input
        style={input}
        placeholder="Phone Number (07XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={loading}
      />

      <input
        style={input}
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
      />

      <div style={btnGroup}>
        <button
          style={{ ...depositBtn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={() => handleTransaction("deposit")}
        >
          Deposit
        </button>

        <button
          style={{ ...withdrawBtn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={() => handleTransaction("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {loading && <p style={{ marginTop: 10 }}>Processing...</p>}

      <h3 style={{ marginTop: 30 }}>Recent Transactions</h3>

      <table style={table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="4">No transactions</td></tr>
          ) : (
            transactions.map((t, i) => (
              <tr key={i}>
                <td style={{
                  color: t.type === "mpesa_deposit" ? "green" : "red",
                  fontWeight: "bold"
                }}>
                  {t.type === "mpesa_deposit" ? "Deposit" : "Withdraw"}
                </td>

                <td>{formatKES(t.amount)}</td>
                <td>{t.description}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}


// ✅ STYLES (REQUIRED — prevents build crash)

const container = {
  padding: 30,
  maxWidth: 600
};

const balanceBox = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 20,
  padding: 15,
  background: "#111827",
  color: "#fff",
  borderRadius: 10
};

const balanceValue = {
  fontSize: 18,
  fontWeight: "bold",
  marginTop: 5
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const btnGroup = {
  display: "flex",
  gap: 10,
  marginTop: 15
};

const depositBtn = {
  flex: 1,
  padding: 12,
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const withdrawBtn = {
  flex: 1,
  padding: 12,
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const table = {
  width: "100%",
  marginTop: 10,
  borderCollapse: "collapse"
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: 10,
  marginTop: 10,
  borderRadius: 6
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: 10,
  marginTop: 10,
  borderRadius: 6
};
