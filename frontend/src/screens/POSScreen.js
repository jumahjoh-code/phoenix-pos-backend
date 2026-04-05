import React, { useState, useEffect, useRef } from "react";

// DESIGN
import colors from "../design/colors";
import spacing from "../design/spacing";
import Card from "../ui/components/Card";

import BarcodeInput from "../components/BarcodeInput";
import ProductGrid from "../components/ProductGrid";
import CartTable from "../components/CartTable";
import PaymentPanel from "../components/PaymentPanel";
import ReceiptModal from "../components/ReceiptModal";

// SERVICES
import { getProducts } from "../core/services/productService";
import { completeSale } from "../services/salesService";

// OFFLINE
import { syncOfflineSales } from "../core/offline/syncService";

export default function POSScreen() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashReceived, setCashReceived] = useState(0);
  const [receipt, setReceipt] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [error, setError] = useState(null);

  const barcodeRef = useRef();

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getProducts();
        const data = await res.json();
        setProducts(data || []);
      } catch {
        setError("Cannot load products");
      }
    };

    loadProducts();
  }, []);

  // AUTO FOCUS
  useEffect(() => {
    if (!isPaying && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [cart, isPaying]);

  // AUTO SYNC
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncOfflineSales();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // CART LOGIC
  // =========================
  const addProduct = (input) => {
    if (processing) return false;

    let product =
      typeof input === "object"
        ? input
        : products.find((p) => p.barcode === input);

    if (!product) return false;

    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);

      if (existing) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          retail_price: Number(product.retail_price || 0),
          quantity: 1,
          stock: Number(product.stock_quantity || 0),
        },
      ];
    });

    return true;
  };

  const increaseQty = (id) => {
    if (processing) return;

    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    if (processing) return;

    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    if (processing) return;
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.retail_price * item.quantity,
    0
  );

  // =========================
  // COMPLETE SALE (NEW FLOW)
  // =========================
  const handleCashPayment = async () => {
    if (processing) return;

    if (!cashReceived || cashReceived <= 0) {
      alert("Enter valid cash");
      return;
    }

    if (cashReceived < total) {
      alert("Insufficient cash");
      return;
    }

    setProcessing(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.retail_price,
        })),
        total: total,
        payment: {
          amount: Number(cashReceived),
          method: "cash",
        },
      };

      console.log("🧾 COMPLETE SALE PAYLOAD:", payload);

      const result = await completeSale(payload);

      console.log("✅ COMPLETE SALE RESULT:", result);

      // ✅ Show receipt
      setReceipt(result);

      // ✅ Reset POS
      setCart([]);
      setCashReceived(0);
      setIsPaying(false);

    } catch (err) {
      console.error(err);
      alert("Sale failed");
    } finally {
      setProcessing(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: spacing.lg, color: colors.danger }}>
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: colors.background,
      }}
    >
      {/* LEFT */}
      <div style={{ flex: 2, padding: spacing.lg }}>
        <h2 style={{ color: colors.primary }}>POS</h2>

        <BarcodeInput
          ref={barcodeRef}
          onScan={addProduct}
          disabled={isPaying || processing}
        />

        <Card style={{ marginTop: spacing.md }}>
          <ProductGrid products={products} onAdd={addProduct} />
        </Card>
      </div>

      {/* RIGHT */}
      <div
        style={{
          flex: 1,
          background: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3>Cart ({cart.length})</h3>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <CartTable
            cart={cart}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            removeFromCart={removeFromCart}
          />
        </div>

        <PaymentPanel
          total={total}
          cashReceived={cashReceived}
          setCashReceived={(v) => setCashReceived(Number(v))}
          change={cashReceived - total}
          completeSale={handleCashPayment}
          disabled={cart.length === 0 || processing}
          onFocusPayment={() => setIsPaying(true)}
          onBlurPayment={() => setIsPaying(false)}
        />
      </div>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}