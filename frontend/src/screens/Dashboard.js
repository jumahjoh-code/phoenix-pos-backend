import { useEffect, useState, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import { Search, Sun, Moon, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";

import colors from "../design/colors";
import spacing from "../design/spacing";
import Card from "../ui/components/Card";
import KPICard from "../ui/components/KPICard";

// SERVICES
import {
  getTodaySummary,
  getCashierPerformance
} from "../core/services/salesService";

import {
  getDashboardSummary,
  getRecentSales
} from "../core/services/dashboardService";

// 🔥 BACKUP SERVICE
import {
  createBackup,
  getBackups,
  restoreBackup
} from "../core/services/backupService";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");

  const [summary, setSummary] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [ai, setAI] = useState(null);

  const [backups, setBackups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const mountedRef = useRef(true);

  const formatKES = (v) =>
    "KES " + Number(v || 0).toLocaleString();

  const theme = darkMode
    ? {
        bg: "#111827",
        card: "#1F2937",
        text: "#F9FAFB",
        subtext: "#9CA3AF"
      }
    : {
        bg: colors.background,
        card: colors.surface,
        text: colors.text,
        subtext: colors.subtext
      };

  // =========================
  // 📊 LOAD DATA
  // =========================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, cashierRes, aiRes, salesRes] = await Promise.all([
        getTodaySummary(),
        getCashierPerformance(),
        getDashboardSummary(),
        getRecentSales()
      ]);

      if (!summaryRes.ok || !cashierRes.ok || !aiRes.ok || !salesRes.ok) {
        throw new Error("Dashboard API failed");
      }

      if (!mountedRef.current) return;

      setSummary(summaryRes.data || {});
      setCashiers(cashierRes.data?.data || []);
      setAI(aiRes.data || null);
      setSalesData(salesRes.data || []);
      setInventoryValue(aiRes.data?.inventory_value || 0);
      setLastUpdated(new Date());

    } catch (err) {
      console.error("❌ Dashboard Error:", err);
      if (mountedRef.current) setError("Failed to load dashboard");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // =========================
  // 💾 LOAD BACKUPS
  // =========================
  const loadBackups = async () => {
    const res = await getBackups();
    if (res.ok) {
      setBackups(res.data.backups || []);
    }
  };

  // =========================
  // 📦 CREATE BACKUP
  // =========================
  const handleBackup = async () => {
    setMessage("");
    const res = await createBackup();

    if (res.ok) {
      setMessage("✅ Backup created");
      loadBackups();
    } else {
      setMessage(res.error || "Backup failed");
    }
  };

  // =========================
  // 🔁 RESTORE
  // =========================
  const handleRestore = async (file) => {
    if (!window.confirm("⚠️ This will overwrite current data. Continue?")) return;

    const res = await restoreBackup(`backups/${file}`);

    if (res.ok) {
      setMessage("✅ Restore successful. Please refresh.");
    } else {
      setMessage(res.error || "Restore failed");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    loadBackups();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // AUTO REFRESH
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredCashiers = cashiers.filter((c) =>
    c?.cashier?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: spacing.lg }}>Loading...</div>;
  if (error) return <div style={{ padding: spacing.lg, color: colors.danger }}>{error}</div>;

  return (
    <div style={{
      background: theme.bg,
      color: theme.text,
      minHeight: "100vh",
      padding: spacing.lg
    }}>

      {/* HEADER */}
      <div style={topBar}>
        <h2 style={{ color: colors.primary }}>Dashboard</h2>

        <div style={topControls}>
          <div style={searchBox(theme)}>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cashier..."
              style={searchInput(theme)}
            />
          </div>

          <div onClick={() => setDarkMode(!darkMode)} style={{ cursor: "pointer" }}>
            {darkMode ? <Sun /> : <Moon />}
          </div>

          <small style={{ color: theme.subtext }}>
            Updated: {lastUpdated?.toLocaleTimeString() || "-"}
          </small>
        </div>
      </div>

      {/* KPI */}
      <div style={grid}>
        <KPICard title="Sales" value={formatKES(summary?.total_sales)} icon={<DollarSign />} />
        <KPICard title="Transactions" value={summary?.transactions || 0} icon={<ShoppingCart />} />
        <KPICard title="Profit" value={formatKES(summary?.profit)} icon={<TrendingUp />} />
        <KPICard title="Inventory" value={formatKES(inventoryValue)} icon={<Package />} />
      </div>

      {/* BACKUP PANEL */}
      <Card>
        <h3>Backup & Restore</h3>

        <button onClick={handleBackup} style={backupBtn}>
          Create Backup
        </button>

        {message && <p style={{ marginTop: 10 }}>{message}</p>}

        {backups.map((b, i) => (
          <div key={i} style={backupItem}>
            <span>{b}</span>
            <button onClick={() => handleRestore(b)} style={restoreBtn}>
              Restore
            </button>
          </div>
        ))}
      </Card>

      {/* CHART */}
      <Card>
        <h3>Recent Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total_sales" stroke={colors.primary} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}

// ================= UI =================

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: spacing.lg
};

const topControls = {
  display: "flex",
  gap: spacing.md,
  alignItems: "center"
};

const searchBox = (theme) => ({
  display: "flex",
  alignItems: "center",
  background: theme.card,
  padding: "6px 10px",
  borderRadius: 8
});

const searchInput = (theme) => ({
  border: "none",
  outline: "none",
  marginLeft: 5,
  background: "transparent",
  color: theme.text
});

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: spacing.lg,
  marginBottom: spacing.lg
};

const backupBtn = {
  padding: 10,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const restoreBtn = {
  padding: "4px 10px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const backupItem = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 10
};