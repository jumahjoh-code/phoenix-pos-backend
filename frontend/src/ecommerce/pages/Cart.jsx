import { useCart } from "../context/CartContext";
import { createSale } from "../../core/api/requests/salesApi";
import { useState } from "react";
import ReceiptModal from "../../components/ReceiptModal";

export default function Cart() {
  const { cart, total, removeFromCart, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [saleId, setSaleId] = useState(null);
  const [lastCart, setLastCart] = useState([]);

  // 🔥 PAYMENT STATES
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");

  const change = Number(amountPaid) - total;

  const checkout = async () => {
    try {
      if (!cart.length) return;

      if (paymentMethod === "cash" && change < 0) {
        alert("❌ Insufficient cash");
        return;
      }

      setLoading(true);

      const res = await createSale(cart, {
        id: 1,
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid)
      });

      if (!res?.id) {
        alert("⚠️ Order placed but ID missing");
        return;
      }

      setSaleId(res.id);
      setLastCart(cart);

      clearCart();
      setReceiptOpen(true);

    } catch (err) {
      console.error(err);
      alert(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Cart</h2>

      {cart.length === 0 && <p>Cart is empty</p>}

      {cart.map(item => (
        <div key={item.id}>
          {item.name} x {item.quantity} — 
          KES {(item.price * item.quantity).toLocaleString()}

          <button onClick={() => removeFromCart(item.id)}>
            Remove
          </button>
        </div>
      ))}

      <h3>Total: KES {total.toLocaleString()}</h3>

      {/* 🔥 PAYMENT SECTION */}
      <div style={{ marginTop: 20 }}>
        <h3>Payment</h3>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
        </select>

        {paymentMethod === "cash" && (
          <>
            <input
              type="number"
              placeholder="Amount paid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              style={{ display: "block", marginTop: 10 }}
            />

            <p>
              Change: KES{" "}
              {change > 0 ? change.toLocaleString() : 0}
            </p>
          </>
        )}

        {paymentMethod === "mpesa" && (
          <p style={{ marginTop: 10 }}>
            📱 Awaiting M-Pesa payment...
          </p>
        )}
      </div>

      <button
        onClick={checkout}
        disabled={!cart.length || loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "Processing..." : "Complete Sale"}
      </button>

      {/* RECEIPT */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        saleId={saleId}
        cart={lastCart}
        total={total}
      />
    </div>
  );
}
