import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import { Search, Sun, Moon, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";

// DESIGN SYSTEM
import colors from "../design/colors";
import spacing from "../design/spacing";
import Card from "../ui/components/Card";
import KPICard from "../ui/components/KPICard";
import { API } from "../config";

export default function Dashboard() {

  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ range: "today" });

  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [worstProducts, setWorstProducts] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [ai, setAI] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // SAFE FETCH
  const fetchSafe = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed: ${url}`);
      return await res.json();
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  // STABLE FETCH FUNCTION
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summary,
        sales,
        top,
        worst,
        cashier,
        inventory,
        aiData
      ] = await Promise.all([
        fetchSafe(`${API}/sales/summary/today?range=${filters.range}`),
        fetchSafe(`${API}/sales/reports/daily?range=${filters.range}`),
        fetchSafe(`${API}/sales/reports/top-products`),
        fetchSafe(`${API}/sales/reports/worst-products`),
        fetchSafe(`${API}/sales/cashier-performance`),
        fetchSafe(`${API}/api/inventory-value`),
        fetchSafe(`${API}/ai/dashboard`)
      ]);

      setSummary(summary);
      setSalesData(sales || []);
      setTopProducts(top || []);
      setWorstProducts(worst || []);
      setCashiers(cashier || []);
      setInventoryValue(inventory?.total_inventory_value || 0);
      setAI(aiData);

      setLastUpdated(new Date());

    } catch (err) {
      console.error(err);
      setError(err.message || "Dashboard failed");
    } finally {
      setLoading(false);
    }
  }, [filters.range]);

  // CLEAN EFFECT (NO DUPLICATES)
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  const filteredCashiers = (cashiers || []).filter(c =>
    c?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      background: theme.bg,
      color: theme.text,
      minHeight: "100vh",
      padding: spacing.lg
    }}>

      {/* TOP BAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.lg
      }}>

        <h2 style={{ color: colors.primary }}>Dashboard</h2>

        <div style={{ display: "flex", gap: spacing.md, alignItems: "center" }}>

          <div style={{
            display: "flex",
            alignItems: "center",
            background: theme.card,
            padding: "6px 10px",
            borderRadius: 8
          }}>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cashier..."
              style={{
                border: "none",
                outline: "none",
                marginLeft: 5,
                background: "transparent",
                color: theme.text
              }}
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
            Updated: {lastUpdated?.toLocaleTimeString()}
          </small>
        </div>

      </div>

      {/* KPI */}
      <div style={grid}>
        <KPICard title="Sales" value={formatKES(summary?.total_sales)} icon={<DollarSign />} />
        <KPICard title="Transactions" value={summary?.transactions} icon={<ShoppingCart />} />
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
      </Card>

      {/* PRODUCTS */}
      <Card>
        <h3>Top Products</h3>
        {topProducts.length === 0 ? (
          <p style={{ color: theme.subtext }}>No data</p>
        ) : (
          topProducts.map((p, i) => (
            <Row key={i} name={p.name} value={formatKES(p.total_sales)} />
          ))
        )}
      </Card>

      <Card>
        <h3>Worst Products</h3>
        {worstProducts.length === 0 ? (
          <p style={{ color: theme.subtext }}>No data</p>
        ) : (
          worstProducts.map((p, i) => (
            <Row key={i} name={p.name} value={formatKES(p.total_sales)} danger />
          ))
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
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {filteredCashiers.map((c, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: "pointer"
                  }}
                >
                  <td>{c.username}</td>
                  <td>{c.transactions}</td>
                  <td style={{ color: colors.primary }}>
                    {formatKES(c.total_sales)}
                  </td>
                  <td>{formatKES(c.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

    </div>
  );
}

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

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: spacing.lg,
  marginBottom: spacing.lg
};