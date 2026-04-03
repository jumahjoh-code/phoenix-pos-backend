import React, { useState } from "react";
import { API } from "config";

export default function MpesaCheckout({ total, cartItems, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // 📱 FORMAT PHONE
  // =========================
  const formatPhone = (value) => {
    let phone = value.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "254" + phone.substring(1);
    }

    if (phone.startsWith("7") && phone.length === 9) {
      phone = "254" + phone;
    }

    return phone;
  };

  const isValidPhone = (phone) => /^254\d{9}$/.test(phone);

  // =========================
  // 🔁 POLL PAYMENT STATUS
  // =========================
  const pollPaymentStatus = (reference) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`${API}/mpesa/status/${reference}`);

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "success") {
          clearInterval(interval);
          setMessage("✅ Payment confirmed!");
          onSuccess && onSuccess();
        }

        if (attempts > 20) {
          clearInterval(interval);
          setMessage("⏱️ Payment timeout. Try again.");
        }

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  // =========================
  // 💳 HANDLE PAYMENT
  // =========================
  const handlePayment = async () => {
    const numericAmount = Number(total);

    if (!numericAmount || numericAmount <= 0) {
      setMessage("Invalid amount");
      return;
    }

    if (!phone) {
      setMessage("Enter phone number");
      return;
    }

    const formattedPhone = formatPhone(phone);

    if (!isValidPhone(formattedPhone)) {
      setMessage("Invalid phone format (07XXXXXXXX)");
      return;
    }

    const payload = {
      phone: formattedPhone,
      amount: numericAmount,
    };

    console.log("🚀 STK Payload:", payload);

    setLoading(true);
    setMessage("Sending STK push...");

    try {
      const response = await fetch(`${API}/mpesa/stk-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "STK failed");
      }

      if (data.success) {
        setMessage("📲 Check your phone and enter PIN");

        const reference =
          data.reference || data.checkout_request_id;

        pollPaymentStatus(reference);

      } else {
        setMessage(data.message || "Payment failed");
      }

    } catch (error) {
      console.error("STK Error:", error);
      setMessage(error.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3>M-Pesa Payment</h3>

      <p>Amount: KES {Number(total) || 0}</p>

      <input
        type="text"
        placeholder="Enter phone (07XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={styles.input}
      />

      <button
        onClick={handlePayment}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Processing..." : "Pay with M-Pesa"}
      </button>

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

  message: {
    marginTop: 10,
  },
};
