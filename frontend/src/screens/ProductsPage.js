// src/screens/ProductsPage.js

import React, { useEffect, useState } from "react";

// ✅ SERVICES (FIXED)
import {
  getProducts,
  createProduct,
  deleteProduct
} from "../core/services/productService";

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

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const parseNumber = (val) => Number(val || 0);
  const formatKES = (val) => "KES " + Number(val || 0).toLocaleString();

  // =========================
  // FETCH PRODUCTS (FIXED)
  // =========================
  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await getProducts();
      const data = await res.json();

      setProducts(data || []);
      setFiltered(data || []);

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

  // =========================
  // ADD PRODUCT (FIXED)
  // =========================
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
      const res = await createProduct({
        ...form,
        retail_price: parseNumber(form.retail_price),
        cost_price: parseNumber(form.cost_price),
        stock_quantity: parseNumber(form.stock_quantity)
      });

      if (!res || !res.ok) {
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

  // =========================
  // DELETE PRODUCT (FIXED)
  // =========================
  const handleDelete = async (id) => {

    if (actionLoading) return;

    if (!window.confirm("Delete product?")) return;

    setActionLoading(true);

    try {
      const res = await deleteProduct(id);

      if (!res || !res.ok) {
        setError("Delete failed");
        return;
      }

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
