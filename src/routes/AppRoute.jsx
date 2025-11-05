import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPages from "../pages/LoginPages";
import HomePage from "../pages/HomePage";
import ForbiddenPage from "../pages/ForbiddenPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<LoginPages />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Trang bảo vệ bằng JWT */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Mặc định chuyển về login */}
      <Route path="*" element={<LoginPages />} />
    </Routes>
  );
}

export default AppRoute;
