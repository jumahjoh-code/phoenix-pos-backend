import React from "react";

const SyncStatus = ({ status, pendingCount }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return { color: "#16a34a", text: "Online" };
      case "offline":
        return { color: "#dc2626", text: "Offline" };
      case "syncing":
        return { color: "#2563eb", text: "Syncing..." };
      case "error":
        return { color: "#f59e0b", text: "Sync Error" };
      default:
        return { color: "#6b7280", text: "Idle" };
    }
  };

  const { color, text } = getStatusConfig();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      fontWeight: 500
    }}>
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: color
        }}
      />
      <span>{text}</span>

      {pendingCount > 0 && (
        <span style={{
          background: "#111827",
          color: "#fff",
          borderRadius: "12px",
          padding: "2px 6px",
          fontSize: "11px"
        }}>
          {pendingCount}
        </span>
      )}
    </div>
  );
};

export default SyncStatus;