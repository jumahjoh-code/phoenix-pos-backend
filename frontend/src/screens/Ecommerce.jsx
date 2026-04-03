import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CartProvider, useCart } from "../ecommerce/context/CartContext";

// PAGES
import Shop from "../ecommerce/pages/Shop";
import Cart from "../ecommerce/pages/Cart";

export default function Ecommerce() {
  return (
    <CartProvider>
      <BrowserRouter>
        <EcommerceLayout />
      </BrowserRouter>
    </CartProvider>
  );
}

/* ================= LAYOUT ================= */

function EcommerceLayout() {
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const isShop = location.pathname === "/";
  const isCart = location.pathname === "/cart";

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>🛍️ Phoenix Shop</h2>

        <div style={styles.nav}>
          <NavBtn active={isShop} onClick={() => navigate("/")}>
            Shop
          </NavBtn>

          <NavBtn active={isCart} onClick={() => navigate("/cart")}>
            Cart ({cartCount})
          </NavBtn>
        </div>
      </div>

      {/* ROUTES */}
      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>

    </div>
  );
}

/* ================= COMPONENT ================= */

function NavBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.btn,
        background: active ? "#FACC15" : "#fff",
        border: active ? "none" : "1px solid #ccc",
        fontWeight: active ? "bold" : "normal"
      }}
    >
      {children}
    </button>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#F3F4F6"
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "#FFFFFF",
    borderBottom: "1px solid #eee"
  },

  nav: {
    display: "flex",
    gap: 10
  },

  content: {
    flex: 1,
    padding: "20px",
    overflowY: "auto"
  },

  btn: {
    padding: "8px 14px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "0.2s"
  }
};