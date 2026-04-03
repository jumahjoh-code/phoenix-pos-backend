import React, { useState } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart,
  DollarSign,
  Smartphone,
  Brain,
  Menu,
  Store
} from "lucide-react";

// ✅ DESIGN SYSTEM
import colors from "../design/colors";
import spacing from "../design/spacing";

export default function MainLayout({
  children,
  currentScreen,
  setCurrentScreen,
  user,
  onLogout
}) {

  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    { key: "dashboard", label: "Dashboard", icon: <Home />, roles: ["admin","manager","supervisor"] },
    { key: "pos", label: "POS", icon: <ShoppingCart />, roles: ["admin","cashier"] },
    { key: "mobile", label: "Mobile POS", icon: <Smartphone />, roles: ["admin","sales","cashier"] },
    { key: "history", label: "Sales", icon: <BarChart />, roles: ["admin","manager","supervisor"] },
    { key: "products", label: "Products", icon: <Package />, roles: ["admin","store_keeper","manager"] },
    { key: "users", label: "Users", icon: <Users />, roles: ["admin"] },
    { key: "cash", label: "Cash", icon: <DollarSign />, roles: ["admin"] },
    { key: "mpesa", label: "M-Pesa", icon: <Smartphone />, roles: ["admin"] },

    // 🔥 NEW: ECOMMERCE (SHOP)
    { key: "ecommerce", label: "Shop", icon: <Store />, roles: ["admin","manager","sales","customer"] },

    { key: "ai", label: "AI", icon: <Brain />, roles: ["admin","manager"] },
  ];

  const allowedMenu = menu.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* SIDEBAR */}
      <div style={{
        width: collapsed ? 70 : 220,
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        padding: spacing.sm,
        transition: "0.2s"
      }}>

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {!collapsed && (
            <h2 style={{ color: colors.primary }}>Phoenix</h2>
          )}

          <Menu
            style={{ cursor: "pointer" }}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* MENU */}
        <div style={{ marginTop: spacing.lg }}>
          {allowedMenu.map(item => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={currentScreen === item.key}
              collapsed={collapsed}
              onClick={() => setCurrentScreen(item.key)}
            />
          ))}
        </div>

      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <div style={{
          height: 60,
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${spacing.lg}px`
        }}>
          <div style={{
            fontWeight: "bold",
            color: colors.text
          }}>
            {currentScreen.toUpperCase()}
          </div>

          <div style={{
            display: "flex",
            gap: spacing.md,
            alignItems: "center"
          }}>

            <span style={{
              fontSize: 14,
              color: colors.subtext
            }}>
              {user?.username} ({user?.role})
            </span>

            <button
              onClick={onLogout}
              style={{
                background: colors.primary,
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Logout
            </button>

          </div>
        </div>

        {/* CONTENT */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: spacing.lg,
          background: colors.background
        }}>
          {children}
        </div>

      </div>

    </div>
  );
}

/* ================= NAV ITEM ================= */

function NavItem({ icon, label, active, collapsed, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 8,
        cursor: "pointer",
        background: active ? colors.primary : "transparent",
        color: active ? "#111827" : colors.text,
        marginBottom: 5
      }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
