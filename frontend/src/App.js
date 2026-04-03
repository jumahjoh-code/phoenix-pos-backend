// src/App.js

import React, { useState, useEffect, Suspense, lazy } from "react";

import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import POSScreen from "./screens/POSScreen";
import SalesHistory from "./screens/SalesHistory";
import ProductsPage from "./screens/ProductsPage";
import Users from "./screens/Users";

import MpesaAgentScreen from "./screens/MpesaAgentScreen";
import CashScreen from "./screens/CashScreen";
import ExpensesScreen from "./screens/ExpensesScreen";

import MobilePOS from "./mobile/MobilePOS";
import AIAssistant from "./screens/AIAssistant";

import MainLayout from "./layout/MainLayout";

// ✅ HOOKS
import useToast from "./ui/hooks/useToast";
import useLoader from "./ui/hooks/useLoader";

// ✅ API LAYER
import { createSale } from "./core/api/requests/salesApi";
import { payCash } from "./core/api/requests/paymentApi";

// 🔐 AUTH
import { getUser, getToken, logout, isTokenExpired } from "./auth/auth";

const Ecommerce = lazy(() => import("./screens/Ecommerce"));

const defaultScreen = {
  admin: "dashboard",
  manager: "dashboard",
  supervisor: "dashboard",
  store_keeper: "products",
  cashier: "pos",
  sales: "mobile",
  customer: "ecommerce",
};

function App() {

  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const { showToast, message } = useToast();
  const { loading, showLoader, hideLoader } = useLoader();

  const api = {
    createSale,
    payCash
  };

  const roleAccess = {
    admin: ["dashboard","pos","mobile","history","products","users","mpesa","cash","expenses","ecommerce","ai"],
    manager: ["dashboard","history","products","ecommerce","ai"],
    supervisor: ["dashboard","history"],
    store_keeper: ["products"],
    cashier: ["pos","mobile"],
    sales: ["mobile","ecommerce"],
    customer: ["ecommerce"],
  };

  // =========================
  // 🔥 AUTH BOOTSTRAP (UPDATED)
  // =========================
  useEffect(() => {

    const init = async () => {

      const token = getToken();
      const savedUser = getUser();

      // 🚫 No session
      if (!token || !savedUser) {
        setScreen("login");
        return;
      }

      // ⛔ Expired token
      if (isTokenExpired()) {
        logout();
        setScreen("login");
        return;
      }

      // 📴 OFFLINE → trust local
      if (!navigator.onLine) {
        setUser(savedUser);
        setScreen(defaultScreen[savedUser.role] || "dashboard");
        return;
      }

      // 🌐 ONLINE → validate
      try {
        const res = await fetch(`/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          logout();
          setScreen("login");
          return;
        }

        const freshUser = await res.json();

        localStorage.setItem("user", JSON.stringify(freshUser));

        setUser(freshUser);
        setScreen(defaultScreen[freshUser.role] || "dashboard");

      } catch {
        // fallback to offline
        setUser(savedUser);
        setScreen(defaultScreen[savedUser.role] || "dashboard");
      }
    };

    init();

  }, []);

  // =========================
  // 🔐 LOGIN
  // =========================
  const handleLoginSuccess = (userData) => {
    showLoader();

    try {
      setUser(userData);

      const nextScreen = defaultScreen[userData.role] || "dashboard";
      setScreen(nextScreen);

      showToast("Login successful", "success");

    } catch {
      showToast("Login failed", "error");
    } finally {
      hideLoader();
    }
  };

  // =========================
  // 🔓 LOGOUT
  // =========================
  const handleLogout = () => {
    showLoader();

    try {
      logout();
      setUser(null);
      setScreen("login");

      showToast("Logged out", "info");

    } finally {
      hideLoader();
    }
  };

  // =========================
  // 🔀 NAVIGATION
  // =========================
  const navigate = (target) => {

    if (!user) return;

    const allowed = roleAccess[user.role] || [];

    if (!allowed.includes(target)) {
      showToast("Access denied", "error");
      return;
    }

    if (target === screen) return;

    setScreen(target);
  };

  // =========================
  // 🎯 SCREEN RENDERER
  // =========================
  const renderScreen = () => {

    if (user) {
      const allowed = roleAccess[user.role] || [];
      if (!allowed.includes(screen)) {
        return <div style={{ padding: 20 }}>Access Denied</div>;
      }
    }

    const props = {
      currentScreen: screen,
      setCurrentScreen: navigate,
      user,
      onLogout: handleLogout,
      api
    };

    switch (screen) {
      case "dashboard": return <Dashboard {...props} />;
      case "pos": return <POSScreen {...props} />;
      case "mobile": return <MobilePOS {...props} />;
      case "history": return <SalesHistory {...props} />;
      case "products": return <ProductsPage {...props} />;
      case "users": return <Users {...props} />;
      case "mpesa": return <MpesaAgentScreen {...props} />;
      case "cash": return <CashScreen {...props} />;
      case "expenses": return <ExpensesScreen {...props} />;

      case "ecommerce":
        return (
          <div style={{ height: "100%" }}>
            <Ecommerce user={user} />
          </div>
        );

      case "ai":
        return (
          <AIAssistant
            user={user}
            onBack={() => navigate(defaultScreen[user.role])}
          />
        );

      default:
        return <Dashboard {...props} />;
    }
  };

  // =========================
  // 🔐 LOGIN SCREEN
  // =========================
  if (screen === "login") {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // =========================
  // 🧠 AI FULL SCREEN
  // =========================
  if (screen === "ai") {
    return renderScreen();
  }

  return (
    <>
      <MainLayout
        currentScreen={screen}
        setCurrentScreen={navigate}
        user={user}
        onLogout={handleLogout}
      >
        <Suspense fallback={<div style={{ padding: 20 }}>Loading module...</div>}>
          {renderScreen()}
        </Suspense>
      </MainLayout>

      {loading && (
        <div style={loaderStyle}>
          Loading...
        </div>
      )}

      {message && (
        <div style={{
          ...toastStyle,
          background:
            message.type === "error" ? "#fee2e2" :
            message.type === "success" ? "#dcfce7" :
            "#e5e7eb"
        }}>
          {message.text}
        </div>
      )}
    </>
  );
}

export default App;

// ================= UI =================

const loaderStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 20,
  zIndex: 1000
};

const toastStyle = {
  position: "fixed",
  bottom: 20,
  right: 20,
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #ddd",
  zIndex: 1000
};
