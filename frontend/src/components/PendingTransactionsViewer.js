import React, { useEffect, useState } from "react";
import { getQueue } from "../services/offlineQueue";
import { syncQueue } from "../services/syncService";

const PendingTransactionsViewer = ({ onClose }) => {

  const [queue, setQueue] = useState([]);

  const loadQueue = () => {
    setQueue(getQueue());
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleRetry = async () => {
    await syncQueue();
    loadQueue();
  };

  const handleClear = () => {
    localStorage.removeItem("offline_queue");
    loadQueue();
  };

  return (
    <div style={overlay}>
      <div style={modal}>

        <div style={header}>
          <h3>Pending Transactions</h3>
          <button onClick={onClose}>✖</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <button onClick={handleRetry}>🔁 Retry Sync</button>
          <button onClick={handleClear} style={{ marginLeft: 10 }}>
            🗑 Clear Queue
          </button>
        </div>

        {queue.length === 0 ? (
          <p>No pending transactions</p>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {queue.map((item, index) => (
              <div key={index} style={itemBox}>
                <strong>{item.url}</strong>
                <pre style={pre}>
                  {JSON.stringify(item.options?.body ? JSON.parse(item.options.body) : {}, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default PendingTransactionsViewer;

// ================= STYLES =================

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: "500px",
  maxWidth: "90%"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
};

const itemBox = {
  border: "1px solid #ddd",
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  background: "#f9fafb"
};

const pre = {
  fontSize: 12,
  overflowX: "auto"
};