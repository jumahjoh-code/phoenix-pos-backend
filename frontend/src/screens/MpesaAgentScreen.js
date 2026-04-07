import React, { useState, useEffect, useRef, useCallback } from "react";
import { API } from "../config";

export default function MpesaAgentScreen() {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const mountedRef = useRef(true);

  const formatKES = (val) =>
    "KES " + Number(val || 0).toLocaleString();

  // =========================
  // 📱 PHONE FORMAT
  // =========================
  const formatPhone = (value) => {
    let p = value.replace(/\D/g, "");

    if (p.startsWith("0")) p = "254" + p.slice(1);
    if (p.startsWith("7") && p.length === 9) p = "254" + p;

    return p;
  };

  const isValidPhone = (p) => /^254\d{9}$/.test(p);

  // =========================
  // 📥 FETCH BALANCES
  // =========================
  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch(`${API}/ledger/summary`);
      const data = await res.json();

      if (mountedRef.current) {
        setLedger(data || {});
      }
    } catch (err) {
      console.error("Balance error:", err);
    }
  }, []);

  // =========================
  // 📥 FETCH TRANSACTIONS
  // =========================
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/ledger`);
      const data = await res.json();

      const safeData = Array.isArray(data) ? data : [];

      const filtered = safeData.filter(
        (t) =>
          t.type === "mpesa_deposit" ||
          t.type === "mpesa_withdraw"
      );

      if (mountedRef.current) {
        setTransactions(filtered.slice(0, 10));
      }
    } catch (err) {
      console.error("Transaction error:", err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchBalances();
    fetchTransactions();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchBalances, fetchTransactions]);

  // =========================
  // 💳 HANDLE TRANSACTION
  // =========================
  const handleTransaction = async (type) => {
    if (loading) return;

    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);
    const formattedPhone = formatPhone(phone);

    if (!isValidPhone(formattedPhone)) {
      setError("Enter valid phone (07XXXXXXXX)");
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
          phone: formattedPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || data.detail || "Transaction failed");
      }

      if (mountedRef.current) {
        setSuccess("✅ Transaction successful");
        setAmount("");
        setPhone("");
      }

      await fetchBalances();
      await fetchTransactions();

    } catch (err) {
      console.error(err);

      if (mountedRef.current) {
        setError(err.message || "❌ Server error");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={container}>
      <h2>📱 M-Pesa Agent</h2>

      {/* BALANCE */}
      <div style={balanceBox}>
        <div>
          💵 Cash
          <div style={balanceValue}>
            {formatKES(ledger?.cash_balance)}
          </div>
        </div>

        <div>
          📲 Float
          <div style={balanceValue}>
            {formatKES(ledger?.mpesa_agent_balance)}
          </div>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {success && <div style={successBox}>{success}</div>}

      {/* INPUTS */}
      <input
        style={input}
        placeholder="07XXXXXXXX"
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

      {/* ACTIONS */}
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

      {/* TRANSACTIONS */}
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
            <tr>
              <td colSpan="4">No transactions</td>
            </tr>
          ) : (
            transactions.map((t, i) => (
              <tr key={i}>
                <td
                  style={{
                    color:
                      t.type === "mpesa_deposit"
                        ? "green"
                        : "red",
                    fontWeight: "bold",
                  }}
                >
                  {t.type === "mpesa_deposit"
                    ? "Deposit"
                    : "Withdraw"}
                </td>

                <td>{formatKES(t.amount)}</td>
                <td>{t.description}</td>
                <td>
                  {new Date(t.created_at).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}