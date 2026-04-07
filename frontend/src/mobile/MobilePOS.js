import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getProducts } from "../core/services/productService";
import { completeSale } from "../services/salesService";

export default function MobilePOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const scannerRef = useRef(null);
  const mountedRef = useRef(true);

  // =========================
  // 📦 LOAD PRODUCTS (SAFE)
  // =========================
  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      const res = await getProducts();

      if (!res.ok) {
        setError(res.error || "Failed to load products");
        return;
      }

      if (mountedRef.current) {
        setProducts(res.data || []);
      }
    };

    load();

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  // =========================
  // ➕ ADD TO CART
  // =========================
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      if (exists) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.retail_price || 0),
          qty: 1,
        },
      ];
    });
  }, []);

  // =========================
  // 📷 SCAN SUCCESS
  // =========================
  const handleScan = useCallback((decodedText) => {
    const product = products.find(
      (p) => p.barcode === decodedText
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    addToCart(product);
  }, [products, addToCart]);

  // =========================
  // ▶️ START SCANNER
  // =========================
  const startScanner = async () => {
    if (scanning) return;

    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        handleScan
      );
    } catch (err) {
      console.error(err);
      alert("Camera error");
      setScanning(false);
    }
  };

  // =========================
  // ⏹ STOP SCANNER (SAFE)
  // =========================
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn("Scanner stop error:", err);
    }
    setScanning(false);
  };

  // =========================
  // 💰 TOTAL
  // =========================
  const total = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  // =========================
  // 💳 COMPLETE SALE
  // =========================
  const handleSale = async () => {
    if (loading) return;

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: cart.map((i) => ({
          product_id: i.id,
          quantity: i.qty,
          price: i.price,
        })),
        total,
        payments: [
          {
            amount: total,
            method: "cash",
          },
        ],
      };

      const res = await completeSale(payload);

      if (!res.ok) {
        throw new Error(res.error || "Sale failed");
      }

      alert("✅ Sale complete");
      setCart([]);

    } catch (err) {
      console.error(err);
      alert(err.message || "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔍 FILTER
  // =========================
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return <div style={{ padding: 20 }}>{error}</div>;
  }

  return (
    <div style={{ padding: 10 }}>
      <h2>📱 Mobile POS</h2>

      {/* SEARCH */}
      <input
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      {/* SCANNER */}
      {!scanning ? (
        <button onClick={startScanner} style={styles.scanBtn}>
          📷 Scan Barcode
        </button>
      ) : (
        <button onClick={stopScanner} style={styles.stopBtn}>
          ❌ Stop Scanner
        </button>
      )}

      {scanning && <div id="reader" style={{ width: "100%" }} />}

      {/* PRODUCTS */}
      <div style={{ marginBottom: 100 }}>
        {filtered.slice(0, 20).map((p) => (
          <div
            key={p.id}
            onClick={() => addToCart(p)}
            style={styles.product}
          >
            {p.name} - KES {p.retail_price}
          </div>
        ))}
      </div>

      {/* CART SUMMARY */}
      <div style={styles.cart}>
        <div>Total: KES {total}</div>

        <button
          onClick={handleSale}
          style={styles.payBtn}
          disabled={loading}
        >
          {loading ? "Processing..." : "Complete Sale"}
        </button>
      </div>
    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {
  input: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  scanBtn: {
    width: "100%",
    padding: 15,
    marginBottom: 10,
    background: "#007bff",
    color: "#fff",
    fontSize: 16,
    border: "none",
  },
  stopBtn: {
    width: "100%",
    padding: 15,
    marginBottom: 10,
    background: "red",
    color: "#fff",
    fontSize: 16,
    border: "none",
  },
  product: {
    padding: 12,
    borderBottom: "1px solid #ddd",
  },
  cart: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: "2px solid #000",
    padding: 10,
  },
  payBtn: {
    width: "100%",
    padding: 15,
    background: "green",
    color: "#fff",
    fontSize: 18,
    border: "none",
  },
};