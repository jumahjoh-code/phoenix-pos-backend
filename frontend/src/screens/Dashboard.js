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

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");

  const [summary, setSummary] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [ai, setAI] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  // 📊 SAFE DATA LOADER
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

      const summaryData = summaryRes.data || {};
      const cashierData = Array.isArray(cashierRes.data?.data)
        ? cashierRes.data.data
        : [];
      const aiData = aiRes.data || null;
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];

      if (!mountedRef.current) return;

      setSummary(summaryData);
      setCashiers(cashierData);
      setAI(aiData);
      setSalesData(sales);
      setInventoryValue(aiData?.inventory_value || 0);
      setLastUpdated(new Date());

    } catch (err) {
      console.error("❌ Dashboard Error:", err);
      if (mountedRef.current) {
        setError("Failed to load dashboard");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // AUTO REFRESH
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // =========================
  // 🔍 FILTER
  // =========================
  const filteredCashiers = cashiers.filter((c) =>
    c?.cashier?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <div style={{ padding: spacing.lg }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: spacing.lg, color: colors.danger }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      background: theme.bg,
      color: theme.text,
      minHeight: "100vh",
      padding: spacing.lg
    }}>

      {/* TOP BAR */}
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

          <div
            onClick={() => setDarkMode(!darkMode)}
            style={{ cursor: "pointer" }}
          >
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

      {/* AI ALERT */}
      {ai?.alerts?.length > 0 && (
        <Card>
          <h3>AI Alerts</h3>
          {ai.alerts.map((a, i) => (
            <div key={i} style={{ marginTop: spacing.sm }}>
              ⚠️ {a}
            </div>
          ))}
        </Card>
      )}

      {/* CHART */}
      <Card>
        <h3>Recent Sales</h3>

        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total_sales" stroke={colors.primary} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: theme.subtext }}>No data available</p>
        )}
      </Card>

      {/* CASHIERS */}
      <Card>
        <h3>Cashiers</h3>

        {filteredCashiers.length === 0 ? (
          <p style={{ color: theme.subtext }}>No cashier data</p>
        ) : (
          <table style={{ width: "100%" }}>
            <thead>
              <tr style={{ color: theme.subtext }}>
                <th>Name</th>
                <th>Transactions</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {filteredCashiers.map((c, i) => (
                <tr key={i}>
                  <td>{c.cashier}</td>
                  <td>{c.transactions}</td>
                  <td>{formatKES(c.total_sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

    </div>
  );
}

// ================= UI =================

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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