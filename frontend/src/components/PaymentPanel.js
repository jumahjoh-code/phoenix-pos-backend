import React from "react";

export default function PaymentPanel({
  total = 0,
  cashReceived = "",
  setCashReceived,
  change = 0,
  completeSale,
  disabled = false,

  onFocusPayment,
  onBlurPayment
}) {
  return (
    <div>
      <h2>Total: {total}</h2>

      {/* 🔹 CASH INPUT */}
      <input
        type="number"
        placeholder="Cash received"
        value={cashReceived}
        onChange={(e) => setCashReceived(e.target.value)} // ✅ FIXED

        onFocus={onFocusPayment}
        onBlur={onBlurPayment}

        style={{
          padding: "10px",
          fontSize: "16px",
          width: "100%",
        }}
      />

      {/* 🔹 CHANGE */}
      <div style={{ marginTop: "10px", fontWeight: "bold" }}>
        Change: {change > 0 ? change : 0}
      </div>

      {/* 🔹 CASH BUTTON */}
      <button
        onClick={completeSale}
        disabled={disabled}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "15px",
          background: "#0a8f00",
          color: "white",
          fontSize: "18px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Complete Cash Sale
      </button>
    </div>
  );
}