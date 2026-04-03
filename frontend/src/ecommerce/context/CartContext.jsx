import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // 🔥 NORMALIZE PRODUCT (HARDENED)
  const normalizeProduct = (product) => {
    let price = Number(product.price ?? product.retail_price ?? 0);

    // ✅ HARD FIX: prevent NaN
    if (isNaN(price) || price <= 0) {
      console.warn("⚠️ Invalid product price detected:", product);
      price = 0;
    }

    return {
      id: product.id,
      name: product.name || "Unnamed Product",
      price,
      quantity: Number(product.quantity ?? 1)
    };
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);

      const normalized = normalizeProduct(product);

      // ❌ BLOCK BAD PRODUCTS
      if (!normalized.price || normalized.price <= 0) {
        alert("❌ Cannot add product with invalid price");
        return prev;
      }

      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, normalized];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // 🔥 SAFE TOTAL (IMPOSSIBLE TO BREAK)
  const total = cart.reduce((sum, item) => {
    const price = Number(item.price ?? 0);
    const qty = Number(item.quantity ?? 0);

    if (!price || !qty) return sum;

    return sum + price * qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);