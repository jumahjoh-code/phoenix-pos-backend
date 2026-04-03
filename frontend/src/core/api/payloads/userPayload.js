// /api/payloads/userPayload.js

export function buildUserPayload(data) {
  return {
    username: data.username.trim(),
    password: data.password,
    role: data.role || "attendant",
    is_active: true
  };
}
