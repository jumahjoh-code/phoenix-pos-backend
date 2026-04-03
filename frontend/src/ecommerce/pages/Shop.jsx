import { useEffect, useState } from "react";
import { fetchProducts } from "../../core/api/products";
import { useCart } from "../context/CartContext";

export default function Shop() {

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  // ✅ FILTER INLINE (no ESLint warning)
  useEffect(() => {
    const term = search.toLowerCase();

    const result = products.filter(p =>
      (p.name || "").toLowerCase().includes(term)
    );

    setFiltered(result);
  }, [search, products]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();

      if (!Array.isArray(data)) {
        console.error("❌ Invalid product response:", data);
        setProducts([]);
        return;
      }

      setProducts(data);
      setFiltered(data);

    } catch (err) {
      console.error("❌ Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NORMALIZE PRODUCT (SAFE + CONSISTENT)
  const normalizeProduct = (p) => {
    const price = Number(p.price ?? p.retail_price ?? 0);
    const stock = Number(p.stock_quantity ?? 0);

    return {
      id: p.id,
      name: p.name || "Unnamed Product",
      price: isNaN(price) ? 0 : price,
      quantity: 1,
      stock_quantity: isNaN(stock) ? 0 : stock
    };
  };

  const handleAddToCart = (product) => {
    const normalized = normalizeProduct(product);

    if (!normalized.price || normalized.price <= 0) {
      alert("❌ Invalid product price");
      return;
    }

    if (normalized.stock_quantity <= 0) {
      alert("❌ Out of stock");
      return;
    }

    addToCart(normalized);

    alert(`✅ Added ${normalized.name}`);
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>

      {/* 🔍 SEARCH BAR */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <p style={{ textAlign: "center" }}>
          No products found
        </p>
      )}

      <div style={styles.grid}>
        {filtered.map((p) => {

          const price = Number(p.price ?? p.retail_price ?? 0);
          const stock = Number(p.stock_quantity ?? 0);

          return (
            <div key={p.id} style={styles.card}>

              <div style={styles.image}>
                📦
              </div>

              <h4>{p.name || "Unnamed"}</h4>

              <p style={{ fontWeight: "bold" }}>
                KES {price.toLocaleString()}
              </p>

              <p style={{
                fontSize: 12,
                color: stock > 0 ? "#16A34A" : "red"
              }}>
                {stock > 0 ? `In Stock: ${stock}` : "Out of Stock"}
              </p>

              <button
                onClick={() => handleAddToCart(p)}
                disabled={stock <= 0}
                style={{
                  ...styles.btn,
                  background: stock > 0 ? "#FACC15" : "#E5E7EB",
                  cursor: stock > 0 ? "pointer" : "not-allowed"
                }}
              >
                {stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  search: {
    width: "100%",
    padding: "10px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 20
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    border: "1px solid #eee",
    textAlign: "center"
  },

  image: {
    height: 100,
    background: "#f3f4f6",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  btn: {
    marginTop: 10,
    padding: "8px 12px",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold"
  }
};