import React, { useEffect, useState } from "react";
import ReceiptModal from "../components/ReceiptModal";
import { API, getAuthHeaders } from "config";

export default function SalesHistory() {

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const formatKES = (val) =>
    "KES " + Number(val || 0).toLocaleString();

  // =========================
  // 📥 FETCH DATA
  // =========================
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const [salesRes, summaryRes] = await Promise.all([
        fetch(`${API}/sales/`, { headers: getAuthHeaders() }),
        fetch(`${API}/sales/summary/today`, { headers: getAuthHeaders() })
      ]);

      if (!salesRes.ok || !summaryRes.ok) {
        throw new Error();
      }

      let salesData = await salesRes.json();
      const summaryData = await summaryRes.json();

      salesData = salesData.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setSales(salesData);
      setSummary(summaryData);

    } catch {
      setError("Failed to load sales data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // 🧾 VIEW RECEIPT
  // =========================
  const viewReceipt = async (saleId) => {
    try {
      setReceiptLoading(true);

      const res = await fetch(`${API}/sales/${saleId}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setSelectedReceipt(data);

    } catch {
      setError("Failed to load receipt");
    } finally {
      setReceiptLoading(false);
    }
  };

  if (loading) return <p style={styles.msg}>Loading...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>Sales Dashboard</h2>

      {/* REFRESH */}
      <button
        onClick={() => fetchData(true)}
        style={{
          ...styles.refreshBtn,
          opacity: refreshing ? 0.6 : 1
        }}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>

      {/* SUMMARY */}
      {summary && (
        <div style={styles.summaryGrid}>

          <Card title="Transactions" value={summary.transactions} />
          <Card title="Sales" value={formatKES(summary.total_sales)} />
          <Card title="Cost" value={formatKES(summary.total_cost)} />

          <Card
            title="Profit"
            value={formatKES(summary.profit)}
            highlight="green"
          />

          <Card title="Cash" value={formatKES(summary.cash_collected)} />

        </div>
      )}

      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.center}>
                  No sales yet
                </td>
              </tr>
            ) : (
              sales.map(sale => {

                const isPaid = sale.balance <= 0;

                return (
                  <tr
                    key={sale.sale_id}
                    onClick={() => viewReceipt(sale.sale_id)}
                    style={styles.row}
                  >

                    <td>{sale.sale_id}</td>

                    <td>{new Date(sale.date).toLocaleString()}</td>

                    <td>{formatKES(sale.total_amount)}</td>

                    <td>{formatKES(sale.amount_paid)}</td>

                    <td style={{
                      color: sale.balance > 0 ? "red" : "green",
                      fontWeight: "bold"
                    }}>
                      {formatKES(sale.balance)}
                    </td>

                    <td style={{
                      color: isPaid ? "green" : "orange",
                      fontWeight: "bold"
                    }}>
                      {isPaid ? "PAID" : "PENDING"}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECEIPT */}
      {receiptLoading && (
        <p style={styles.msg}>Loading receipt...</p>
      )}

      {selectedReceipt && !receiptLoading && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}

/* COMPONENT */

function Card({ title, value, highlight }) {
  return (
    <div style={{
      ...styles.card,
      background: highlight === "green" ? "#dcfce7" : "#f5f5f5"
    }}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}

/* STYLES */

const styles = {

  container: { padding: 20 },

  title: {
    color: "#FACC15"
  },

  msg: { padding: 20 },

  error: {
    padding: 20,
    color: "#991b1b"
  },

  center: { textAlign: "center" },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    margin: "15px 0"
  },

  card: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #eee",
    textAlign: "center"
  },

  refreshBtn: {
    marginBottom: 10,
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: 6,
    border: "1px solid #ccc"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 600
  },

  row: {
    cursor: "pointer",
    transition: "0.2s"
  }
};
