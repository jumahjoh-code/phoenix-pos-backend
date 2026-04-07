import React, { useState, useRef, useEffect, useCallback } from "react";
import { API } from "config";

export default function MpesaCheckout({ total, cartItems, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const pollingRef = useRef(null);
  const mountedRef = useRef(true);

  // =========================
  // 📱 FORMAT PHONE
  // =========================
  const formatPhone = (value) => {
    let p = value.replace(/\D/g, "");

    if (p.startsWith("0")) p = "254" + p.slice(1);
    if (p.startsWith("7") && p.length === 9) p = "254" + p;

    return p;
  };

  const isValidPhone = (phone) => /^254\d{9}$/.test(phone);

  // =========================
  // 🧹 CLEANUP
  // =========================
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, []);

  // =========================
  // 🔁 POLL PAYMENT STATUS (SAFE)
  // =========================
  const pollPaymentStatus = useCallback((reference) => {
    let attempts = 0;

    stopPolling();

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`${API}/mpesa/status/${reference}`);

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "success") {
          stopPolling();

          if (!mountedRef.current) return;

          setMessage("✅ Payment confirmed!");
          setLoading(false);

          onSuccess?.(data);
        }

        if (data.status === "failed") {
          stopPolling();

          if (!mountedRef.current) return;

          setMessage("❌ Payment failed");
          setLoading(false);
        }

        if (attempts > 20) {
          stopPolling();

          if (!mountedRef.current) return;

          setMessage("⏱️ Payment timeout. Try again.");
          setLoading(false);
        }

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  }, [onSuccess]);

  // =========================
  // 💳 HANDLE PAYMENT
  // =========================
  const handlePayment = async () => {
    if (loading) return;

    const amount = Number(total);

    if (!amount || amount <= 0) {
      setMessage("Invalid amount");
      return;
    }

    if (!phone.trim()) {
      setMessage("Enter phone number");
      return;
    }

    const formattedPhone = formatPhone(phone);

    if (!isValidPhone(formattedPhone)) {
      setMessage("Invalid phone (use 07XXXXXXXX)");
      return;
    }

    const payload = {
      phone: formattedPhone,
      amount,
    };

    console.log("🚀 STK Payload:", payload);

    setLoading(true);
    setMessage("📲 Sending STK push...");

    try {
      const res = await fetch(`${API}/mpesa/stk-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "STK failed");
      }

      if (!data.success) {
        throw new Error(data.message || "Payment failed");
      }

      const reference =
        data.reference || data.checkout_request_id;

      if (!reference) {
        throw new Error("Missing payment reference");
      }

      setMessage("📲 Check your phone and enter PIN");

      pollPaymentStatus(reference);

    } catch (err) {
      console.error("STK Error:", err);

      if (mountedRef.current) {
        setMessage(err.message || "Network error");
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h3>M-Pesa Payment</h3>

      <p>Amount: KES {Number(total) || 0}</p>

      <input
        type="text"
        placeholder="07XXXXXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={styles.input}
        disabled={loading}
      />

      <button
        onClick={handlePayment}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Waiting for payment..." : "Pay with M-Pesa"}
      </button>

      {loading && (
        <button
          onClick={() => {
            stopPolling();
            setLoading(false);
            setMessage("Payment cancelled");
          }}
          style={styles.cancelBtn}
        >
          Cancel
        </button>
      )}

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {
  container: {
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "#fff",
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },

  button: {
    width: "100%",
    padding: 12,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  cancelBtn: {
    width: "100%",
    marginTop: 8,
    padding: 10,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  message: {
    marginTop: 10,
  },
};