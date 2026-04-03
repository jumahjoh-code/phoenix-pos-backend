const API =
  process.env.REACT_APP_API_URL ||
  "https://phoenix-pos-backend.onrender.com";

console.log("🌍 API:", API);

export { API };

export const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return {
    "Content-Type": "application/json",
    Authorization: user?.access_token
      ? `Bearer ${user.access_token}`
      : ""
  };
};