import { useState, useEffect } from "react";
import {
  Menu, Home, ShoppingCart, Package,
  Users, Sun, Moon, Search, Bell
} from "lucide-react";

export default function MainLayout({
  children,
  currentScreen,
  setCurrentScreen,
  user,
  onLogout
}) {

  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
  }, []);

  const theme = {
    main: darkMode ? "#0F172A" : "#F3F4F6",
    sidebar: "#FFFFFF",
    card: "#FFFFFF",
    text: darkMode ? "#FFFFFF" : "#111827",
    subtext: "#6B7280",
    yellow: "#FACC15"
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: theme.main,
      color: theme.text
    }}>

      {/* ================= SIDEBAR ================= */}
      <div style={{
        width: collapsed ? 80 : 260,
        background: theme.sidebar,
        borderRight: "1px solid #e5e7eb",
        padding: 15,
        transition: "0.3s",
        display: "flex",
        flexDirection: "column"
      }}>

        {/* LOGO + TOGGLE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!collapsed && <h2 style={{ color: theme.yellow }}>Phoenix</h2>}
          <Menu onClick={() => setCollapsed(!collapsed)} style={{ cursor: "pointer" }} />
        </div>

        {/* 🔍 SEARCH (MOVED FROM TOPBAR) */}
        {!collapsed && (
          <div style={{
            marginTop: 15,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F3F4F6",
            padding: "6px 10px",
            borderRadius: 8
          }}>
            <Search size={16}/>
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%"
              }}
            />
          </div>
        )}

        {/* 🔔 NOTIFICATIONS */}
        {!collapsed && (
          <div style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            color: theme.subtext
          }}>
            <Bell size={16}/>
            Notifications
          </div>
        )}

        {/* NAVIGATION */}
        <SidebarItem icon={<Home />} label="Dashboard"
          active={currentScreen==="dashboard"}
          onClick={()=>setCurrentScreen("dashboard")}
          collapsed={collapsed}
        />

        <SidebarItem icon={<ShoppingCart />} label="POS"
          active={currentScreen==="pos"}
          onClick={()=>setCurrentScreen("pos")}
          collapsed={collapsed}
        />

        <SidebarItem icon={<Package />} label="Products"
          active={currentScreen==="products"}
          onClick={()=>setCurrentScreen("products")}
          collapsed={collapsed}
        />

        <SidebarItem icon={<Users />} label="Users"
          active={currentScreen==="users"}
          onClick={()=>setCurrentScreen("users")}
          collapsed={collapsed}
        />

        {/* QUICK ACTIONS */}
        {!collapsed && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, color: theme.subtext }}>Quick Actions</p>

            <button style={quickBtn} onClick={()=>setCurrentScreen("pos")}>
              New Sale
            </button>

            <button style={quickBtn} onClick={()=>setCurrentScreen("mpesa")}>
              M-Pesa
            </button>
          </div>
        )}

        {/* USER */}
        <div style={{ marginTop: "auto" }}>

          {!collapsed && (
            <>
              <div style={{ fontWeight: "bold" }}>
                {user?.username || "Admin"}
              </div>
              <div style={{ fontSize: 12, color: theme.subtext }}>
                {user?.role || "Manager"}
              </div>
            </>
          )}

          {/* THEME */}
          <button onClick={()=>setDarkMode(!darkMode)} style={iconBtn}>
            {darkMode ? <Sun/> : <Moon/>}
            {!collapsed && " Theme"}
          </button>

          {/* LOGOUT */}
          <button onClick={onLogout} style={logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div style={{
        flex: 1,
        padding: 20,
        overflowY: "auto"
      }}>
        {children}
      </div>

    </div>
  );
}


/* ================= COMPONENTS ================= */

function SidebarItem({icon,label,active,onClick,collapsed}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 10,
        padding: 12,
        marginTop: 10,
        borderRadius: 10,
        background: active ? "#FACC15" : "transparent",
        cursor: "pointer",
        fontWeight: active ? "bold" : "normal"
      }}
    >
      {icon}
      {!collapsed && label}
    </div>
  );
}


/* ================= STYLES ================= */

const quickBtn = {
  width: "100%",
  padding: 8,
  marginTop: 5,
  background: "#FACC15",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const iconBtn = {
  marginTop: 10,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#FACC15"
};

const logoutBtn = {
  marginTop: 10,
  width: "100%",
  padding: 8,
  background: "red",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};
