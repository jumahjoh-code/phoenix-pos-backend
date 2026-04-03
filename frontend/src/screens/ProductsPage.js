import React, { useEffect, useState } from "react";
import { API } from "config";

export default function ProductsPage() {

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    retail_price: "",
    cost_price: "",
    stock_quantity: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const parseNumber = (val) => Number(val || 0);
  const formatKES = (val) => "KES " + Number(val || 0).toLocaleString();

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${API}/products/`);
      const data = await res.json();

      setProducts(data);
      setFiltered(data);

    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, products]);

  const handleAdd = async () => {

    if (actionLoading) return;

    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Product name required");
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch(`${API}/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          retail_price: parseNumber(form.retail_price),
          cost_price: parseNumber(form.cost_price),
          stock_quantity: parseNumber(form.stock_quantity)
        })
      });

      if (!res.ok) {
        setError("Failed to add product");
        return;
      }

      setSuccess("✅ Product added");

      setForm({
        name: "",
        retail_price: "",
        cost_price: "",
        stock_quantity: ""
      });

      fetchProducts();

    } catch {
      setError("Server error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {

    if (actionLoading) return;

    if (!window.confirm("Delete product?")) return;

    setActionLoading(true);

    try {
      await fetch(`${API}/products/${id}`, { method: "DELETE" });
      setSuccess("Deleted");
      fetchProducts();
    } catch {
      setError("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p style={styles.msg}>Loading...</p>;
  if (error) return <p style={{ ...styles.msg, color: "red" }}>{error}</p>;

  return (
    <div style={styles.page}>

      <h2 style={styles.title}>Products & Inventory</h2>

      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.card}>
        <input
          placeholder="Search product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.card}>
        <h3>Add Product</h3>

        <div style={styles.form}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Retail Price"
            value={form.retail_price}
            onChange={e => setForm({ ...form, retail_price: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Cost Price"
            value={form.cost_price}
            onChange={e => setForm({ ...form, cost_price: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Stock"
            value={form.stock_quantity}
            onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
            style={styles.input}
          />

          <button
            onClick={handleAdd}
            style={styles.primaryBtn}
            disabled={actionLoading}
          >
            {actionLoading ? "Saving..." : "+ Add Product"}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Inventory</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Profit</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(p => {
              const profit = (p.retail_price || 0) - (p.cost_price || 0);

              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.stock_quantity}</td>
                  <td>{formatKES(p.cost_price)}</td>
                  <td>{formatKES(p.retail_price)}</td>
                  <td>{formatKES(profit)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={styles.dangerBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 20,
    maxWidth: 900
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10
  },
  msg: {
    padding: 10
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6
  },
  card: {
    padding: 15,
    border: "1px solid #eee",
    borderRadius: 8,
    background: "#fff",
    marginBottom: 15
  },
  input: {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
    marginRight: 5,
    marginBottom: 5
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5
  },
  primaryBtn: {
    padding: 10,
    background: "#facc15",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold"
  },
  dangerBtn: {
    padding: 6,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  }
};