import React from "react";

const SyncStatus = ({ status = "idle", pendingCount = 0, onClick }) => {

  const getConfig = () => {
    switch (status) {
      case "online":
        return {
          color: "#16a34a",
          text: "Online",
          bg: "rgba(22,163,74,0.08)"
        };
      case "offline":
        return {
          color: "#dc2626",
          text: "Offline",
          bg: "rgba(220,38,38,0.08)"
        };
      case "syncing":
        return {
          color: "#2563eb",
          text: "Syncing...",
          bg: "rgba(37,99,235,0.08)"
        };
      case "error":
        return {
          color: "#f59e0b",
          text: "Sync Error",
          bg: "rgba(245,158,11,0.08)"
        };
      default:
        return {
          color: "#6b7280",
          text: "Idle",
          bg: "rgba(107,114,128,0.08)"
        };
    }
  };

  const { color, text, bg } = getConfig();

  return (
    <div
      onClick={onClick}
      title="Click to view pending transactions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: onClick ? "pointer" : "default",
        padding: "4px 10px",
        borderRadius: 8,
        background: bg,
        transition: "all 0.2s ease"
      }}
    >
      {/* STATUS DOT */}
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
          animation: status === "syncing" ? "pulse 1s infinite" : "none"
        }}
      />

      {/* STATUS TEXT */}
      <span>{text}</span>

      {/* PENDING COUNT */}
      {pendingCount > 0 && (
        <span
          style={{
            background: "#111827",
            color: "#fff",
            borderRadius: "12px",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 600
          }}
        >
          {pendingCount}
        </span>
      )}

      {/* ANIMATION */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.4); opacity: 0.6; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default SyncStatus;