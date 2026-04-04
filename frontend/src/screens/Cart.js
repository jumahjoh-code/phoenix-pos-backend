import React, { useState } from "react";
import MpesaCheckout from "../components/MpesaCheckout";

// ✅ USE CENTRAL API
import { createSale } from "../core/api/requests/salesApi";

export default function Cart({ cart, setCart }) {

  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const formatKES = (value) =>
    "KES " + Number(value || 0).toLocaleString();

  // =========================
  // 🔥 UPDATE QUANTITY
  // =========================
  const updateQty = (id, delta) => {
    if (processing) return;

    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const currentQty = Number(item.quantity || 1);
          const newQty = Math.max(1, currentQty + delta);

          if (item.stock_quantity && newQty > item.stock_quantity) {
            alert("Stock limit reached");
            return item;
          }

          return {
            ...item,
            quantity: newQty
          };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    if (processing) return;

    if (!window.confirm("Remove item?")) return;

    setCart(prev => prev.filter(item => item.id !== id));
  };

  // =========================
  // 💰 TOTALS
  // =========================
  const total = cart.reduce((sum, item) => {
    const price = Number(item.retail_price || item.price || 0);
    const qty = Number(item.quantity || 1);

    if (isNaN(price) || isNaN(qty)) return sum;

    return sum + price * qty;
  }, 0);

  const totalCost = cart.reduce((sum, item) => {
    const cost = Number(item.cost_price || 0);
    const qty = Number(item.quantity || 1);
    return sum + cost * qty;
  }, 0);

  const profit = total - totalCost;

  // =========================
  // 🔥 PAYMENT SUCCESS HANDLER (FIXED)
  // =========================
  const handlePaymentSuccess = async () => {
    try {
      setProcessing(true);

      if (cart.length === 0) {
        throw new Error("Cart is empty");
      }

      // ✅ CLEAN + MATCH BACKEND STRUCTURE
      const cleanCart = cart.map(item => {
        const product_id = item.product_id ?? item.id;

        if (!product_id) {
          console.error("❌ INVALID ITEM:", item);
          throw new Error("Invalid product_id in cart");
        }

        return {
          product_id: Number(product_id),
          quantity: Math.max(1, Number(item.quantity)),
          price: Number(item.retail_price || item.price || 0),
          cost_price: Number(item.cost_price || 0)
        };
      });

      console.log("🧾 CLEAN CART:", cleanCart);

      const result = await createSale(cleanCart, user);

      if (!result || !(result.id || result.sale_id)) {
        console.error("❌ INVALID RESPONSE:", result);
        throw new Error("Invalid response from server");
      }

      alert(`✅ Order placed! ID: ${result.id || result.sale_id}`);

      setCart([]);
      setShowCheckout(false);

    } catch (err) {
      console.error(err);
      alert(err.message || "❌ Failed to save sale");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={styles.container}>

      <h3>🛒 Cart ({cart.length})</h3>

      {cart.length === 0 ? (
        <p style={{ color: "#6B7280" }}>No items</p>
      ) : (
        cart.map(item => {
          const price = Number(item.retail_price || item.price || 0);
          const qty = Number(item.quantity || 1);

          return (
            <div key={item.id} style={styles.item}>

              <div>
                <strong>{item.name}</strong>
                <br />
                <span style={{ color: "#6B7280" }}>
                  {formatKES(price)}
                </span>
              </div>

              <div style={styles.qtyControl}>
                <button
                  onClick={() => updateQty(item.id, -1)}
                  disabled={processing}
                >
                  -
                </button>

                <span>{qty}</span>

                <button
                  onClick={() => updateQty(item.id, 1)}
                  disabled={processing}
                >
                  +
                </button>
              </div>

              <div style={{ fontWeight: "bold" }}>
                {formatKES(price * qty)}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={styles.removeBtn}
                disabled={processing}
              >
                ✕
              </button>

            </div>
          );
        })
      )}

      <hr />

      <p><strong>Total:</strong> {formatKES(total)}</p>

      <p style={{
        color: profit >= 0 ? "green" : "red",
        fontWeight: "bold"
      }}>
        Profit: {formatKES(profit)}
      </p>

      {cart.length > 0 && (
        <button
          style={{
            ...styles.checkoutBtn,
            opacity: processing ? 0.6 : 1
          }}
          disabled={processing}
          onClick={() => setShowCheckout(prev => !prev)}
        >
          {showCheckout ? "Hide Payment" : "Pay with M-Pesa"}
        </button>
      )}

      {showCheckout && (
        <MpesaCheckout
          total={total}
          cartItems={cart}
          onSuccess={handlePaymentSuccess}
          onStart={() => setProcessing(true)}
          onFinish={() => setProcessing(false)}
        />
      )}

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    border: "1px solid #ddd",
    padding: "12px",
    borderRadius: "8px",
    background: "#FFFFFF"
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    gap: 10
  },

  qtyControl: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },

  removeBtn: {
    border: "none",
    background: "red",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    padding: "5px 8px"
  },

  checkoutBtn: {
    marginTop: "10px",
    padding: "12px",
    width: "100%",
    background: "#16A34A",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};