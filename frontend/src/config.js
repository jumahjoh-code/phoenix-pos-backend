const API = "";

console.log("🌍 API BASE:", window.location.origin);

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
