// src/screens/Dashboard.js

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import { Search, Sun, Moon, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";

import colors from "../design/colors";
import spacing from "../design/spacing";
import Card from "../ui/components/Card";
import KPICard from "../ui/components/KPICard";

// ✅ CORRECT PATH (FIXED)
import { authFetch } from "../../core/api/apiClient";

export default function Dashboard() {

  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ range: "today" });

  const [summary, setSummary] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [worstProducts, setWorstProducts] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [ai, setAI] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

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
  // 🔐 SAFE FETCH
  // =========================
  const fetchSafe = async (endpoint) => {
    try {
      const res = await authFetch(endpoint);

      if (!res || !res.ok) return null;

      return await res.json();
    } catch {
      return null;
    }
  };

  // =========================
  // 📊 DATA LOADER
  // =========================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.all([
        fetchSafe(`/sales/summary/today?range=${filters.range}`),
        fetchSafe(`/sales/reports/daily?range=${filters.range}`),
        fetchSafe(`/sales/reports/top-products`),
        fetchSafe(`/sales/reports/worst-products`),
        fetchSafe(`/sales/cashier-performance`),
        fetchSafe(`/api/inventory-value`),
        fetchSafe(`/ai/dashboard`)
      ]);

      const [
        summary,
        sales,
        top,
        worst,
        cashier,
        inventory,
        aiData
      ] = results;

      setSummary(summary || {});
      setSalesData(Array.isArray(sales) ? sales : []);
      setTopProducts(Array.isArray(top) ? top : []);
      setWorstProducts(Array.isArray(worst) ? worst : []);
      setCashiers(Array.isArray(cashier) ? cashier : []);
      setInventoryValue(inventory?.total_inventory_value || 0);
      setAI(aiData || null);

      setLastUpdated(new Date());

    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [filters]);

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

  const filteredCashiers = cashiers.filter(c =>
    c?.cashier?.toLowerCase().includes(search.toLowerCase())
  );

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

          <select
            value={filters.range}
            onChange={(e) => setFilters({ range: e.target.value })}
          >
            <option value="today">Today</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>

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
        <h3>Sales vs Profit</h3>

        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total_sales" stroke={colors.primary} />
              <Line type="monotone" dataKey="profit" stroke="#22C55E" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: theme.subtext }}>No chart data available</p>
        )}
      </Card>

      {/* PRODUCTS */}
      <Card>
        <h3>Top Products</h3>
        {topProducts.length === 0
          ? <p style={{ color: theme.subtext }}>No data</p>
          : topProducts.map((p, i) => (
              <Row key={i} name={p.name} value={formatKES(p.quantity)} />
            ))
        }
      </Card>

      <Card>
        <h3>Worst Products</h3>
        {worstProducts.length === 0
          ? <p style={{ color: theme.subtext }}>No data</p>
          : worstProducts.map((p, i) => (
              <Row key={i} name={p.name} value={formatKES(p.quantity)} danger />
            ))
        }
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

function Row({ name, value, danger }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8
    }}>
      <span>{name}</span>
      <span style={{ color: danger ? colors.danger : colors.primary }}>
        {value}
      </span>
    </div>
  );
}
