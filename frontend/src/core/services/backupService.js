import { authFetch } from "../api/apiClient";

// ==========================
// 📦 CREATE BACKUP
// ==========================
export const createBackup = async () => {
  try {
    const res = await authFetch("/backup/create", {
      method: "POST",
    });

    const data = await res.json();

    return {
      ok: res.ok,
      data,
      error: data?.detail || "Backup failed",
    };
  } catch (err) {
    console.error("❌ createBackup error:", err);
    return { ok: false, error: "Network error" };
  }
};


// ==========================
// 📂 GET BACKUPS
// ==========================
export const getBackups = async () => {
  try {
    const res = await authFetch("/backup/list");

    const data = await res.json();

    return {
      ok: res.ok,
      data,
      error: data?.detail || "Failed to fetch backups",
    };
  } catch (err) {
    console.error("❌ getBackups error:", err);
    return { ok: false, error: "Network error" };
  }
};


// ==========================
// ♻️ RESTORE BACKUP
// ==========================
export const restoreBackup = async (file) => {
  try {
    const res = await authFetch("/backup/restore", {
      method: "POST",
      body: JSON.stringify({ file }),
    });

    const data = await res.json();

    return {
      ok: res.ok,
      data,
      error: data?.detail || "Restore failed",
    };
  } catch (err) {
    console.error("❌ restoreBackup error:", err);
    return { ok: false, error: "Network error" };
  }
};