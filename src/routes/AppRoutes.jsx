import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import HomePage from '../pages/HomePage';
import HRRequestPage from '../pages/HRRequestPage';
import ProtectedRoute from '../components/ProtectedRoute';

// --- THÊM IMPORT ---
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
// ---

const AppRoutes = () => {
  return (
    <Routes>
      {/* Trang chính */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* --- THÊM 2 ROUTE MỚI --- */}
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* --- */}

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
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;
