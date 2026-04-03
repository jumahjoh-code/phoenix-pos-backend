// src/auth/AdminRoute.js

import { Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin } from "./auth";

export default function AdminRoute({ children }) {

  // 🚫 Not logged in
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Logged in but not admin
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // ✅ Admin → allow access
  return children;
}
