import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { API } from "config"; // ✅ FIXED

export default function MobilePOS() {

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef(null);

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    fetch(`${API}/products/`)
      .then(res => res.json())
      .then(setProducts)
      .catch(() => alert("Failed to load products"));
  }, []);

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === product.id);

      if (exists) {
        return prev.map(p =>
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
          price: Number(product.retail_price),
          qty: 1
        }
      ];
    });
  };

  // =========================
  // SCAN SUCCESS
  // =========================
  const handleScan = (decodedText) => {
    const product = products.find(p => p.barcode === decodedText);

    if (!product) {
      alert("Product not found");
      return;
    }

    addToCart(product);
  };

  // =========================
  // START SCANNER
  // =========================
  const startScanner = async () => {
    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 }
        },
        handleScan,
        () => {}
      );
    } catch (err) {
      console.error(err);
      alert("Camera error");
      setScanning(false);
    }
  };

  // =========================
  // STOP SCANNER
  // =========================
  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // =========================
  // TOTAL
  // =========================
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // =========================
  // COMPLETE SALE
  // =========================
  const completeSale = async () => {

    if (loading) return;

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setLoading(true);

    try {
      const items = cart.map(i => ({
        product_id: i.id,
        quantity: i.qty
      }));

      const res = await fetch(`${API}/sales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items,
          total,
          amount_paid: total
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Sale failed");
        return;
      }

      alert("✅ Sale complete");
      setCart([]);

    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 10 }}>

      <h2>📱 Mobile POS</h2>

      {/* 🔍 SEARCH */}
      <input
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          marginBottom: 10
        }}
      />

      {/* 📷 SCANNER BUTTON */}
      {!scanning ? (
        <button
          onClick={startScanner}
          style={{
            width: "100%",
            padding: 15,
            marginBottom: 10,
            background: "#007bff",
            color: "#fff",
            fontSize: 16,
            border: "none"
          }}
        >
          📷 Scan Barcode
        </button>
      ) : (
        <button
          onClick={stopScanner}
          style={{
            width: "100%",
            padding: 15,
            marginBottom: 10,
            background: "red",
            color: "#fff",
            fontSize: 16,
            border: "none"
          }}
        >
          ❌ Stop Scanner
        </button>
      )}

      {/* 📷 CAMERA VIEW */}
      {scanning && (
        <div id="reader" style={{ width: "100%", marginBottom: 10 }} />
      )}

      {/* 🛒 PRODUCTS */}
      <div style={{ marginBottom: 100 }}>
        {filtered.slice(0, 20).map(p => (
          <div
            key={p.id}
            onClick={() => addToCart(p)}
            style={{
              padding: 12,
              borderBottom: "1px solid #ddd"
            }}
          >
            {p.name} - KES {p.retail_price}
          </div>
        ))}
      </div>

      {/* 🧾 CART */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "2px solid #000",
        padding: 10
      }}>
        <div>Total: KES {total}</div>

        <button
          onClick={completeSale}
          style={{
            width: "100%",
            padding: 15,
            background: "green",
            color: "#fff",
            fontSize: 18,
            border: "none"
          }}
        >
          Complete Sale
        </button>
      </div>

    </div>
  );
}
