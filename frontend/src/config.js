const API = "https://phoenix-pos-backend-3.onrender.com";

console.log("🌍 API BASE:", API);

export { API };

export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : ""
  };
};