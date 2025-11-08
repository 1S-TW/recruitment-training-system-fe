// AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const loginUser = (token) => {
    localStorage.setItem("token", token);
    setToken(token); // cập nhật state → ProtectedRoute đọc được
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
