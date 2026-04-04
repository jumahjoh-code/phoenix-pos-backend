export const API = "https://phoenix-pos-backend-3.onrender.com/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};