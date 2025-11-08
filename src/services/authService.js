// src/services/authService.js
import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userEmail", email);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Đăng nhập thất bại");
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
};

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
