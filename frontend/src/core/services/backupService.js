import React, { useEffect, useState } from "react";
import {
  createBackup,
  getBackups,
  restoreBackup
} from "../core/services/backupService";

export default function BackupManager() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // LOAD BACKUPS
  // =========================
  const loadBackups = async () => {
    const res = await getBackups();
    if (res.ok) {
      setBackups(res.data.backups || []);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // =========================
  // CREATE BACKUP
  // =========================
  const handleBackup = async () => {
    setLoading(true);
    setMessage("");

    const res = await createBackup();

    if (res.ok) {
      setMessage("✅ Backup created");
      loadBackups();
    } else {
      setMessage(res.error || "Backup failed");
    }

    setLoading(false);
  };

  // =========================
  // RESTORE
  // =========================
  const handleRestore = async (file) => {
    const confirmRestore = window.confirm(
      `⚠️ Restore will overwrite current data.\n\nProceed?`
    );

    if (!confirmRestore) return;

    setLoading(true);
    setMessage("");

    const res = await restoreBackup(file);

    if (res.ok) {
      setMessage("✅ Restore successful (reload system)");
    } else {
      setMessage(res.error || "Restore failed");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h3>Backup & Restore</h3>

      <button onClick={handleBackup} disabled={loading} style={styles.button}>
        {loading ? "Processing..." : "Create Backup"}
      </button>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.list}>
        {backups.length === 0 ? (
          <p>No backups found</p>
        ) : (
          backups.map((file, index) => (
            <div key={index} style={styles.item}>
              <span>{file}</span>

              <button
                onClick={() => handleRestore(`backups/${file}`)}
                style={styles.restoreBtn}
              >
                Restore
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #eee",
  },
  button: {
    padding: 10,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  restoreBtn: {
    padding: "5px 10px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  list: {
    marginTop: 15,
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #eee",
  },
  message: {
    marginTop: 10,
  },
};