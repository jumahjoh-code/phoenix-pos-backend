// src/auth/ProtectedRoute.js

import { Navigate } from "react-router-dom";
import { isAuthenticated } from "./auth";

export default function ProtectedRoute({ children }) {

  const authenticated = isAuthenticated();

  // 🚫 Not logged in → redirect to login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in → allow access
  return children;
}
