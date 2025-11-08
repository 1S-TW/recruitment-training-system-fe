// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import HRRequestPage from "../pages/HrRequestPage"; // Thêm dòng này
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Trang chính */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Trang Nhu cầu nhân sự */}
      <Route
        path="/recruitment/needs"
        element={
          <ProtectedRoute>
            <HRRequestPage />
          </ProtectedRoute>
        }
      />

      {/* Nếu người dùng nhập sai URL */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default AppRoutes;
