import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// ✅ ProtectedRoute ở cùng thư mục routes
import ProtectedRoute from "./ProtectedRoute";

// Các trang
import LoginPage from "../pages/LoginPage";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import HomePage from "../pages/HomePage";
import HrRequestPage from "../pages/HrRequestPage";
import RecruitmentPlanPage from "../pages/RecruitmentPlanPage";
import VerifyEmail from "../pages/VerifyEmail";
import ResetPassword from "../pages/ResetPassword";
import ForbiddenPage from "../pages/ForbiddenPage";

// 👇 Import trang quản lý Admin
import UserManagement from "../pages/admin/UserManagement";

// 👇 page quản lý ứng viên
import CandidateManagementPage from "../pages/CandidateManagementPage";

// 👇 page Quản lý đào tạo
import TrainingManagementPage from "../pages/TrainingManagementPage";

/**
 * Route dành cho khách (chưa login).
 * Nếu đã đăng nhập thì redirect ra ngoài (về trang chính).
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    // Đã đăng nhập thì đẩy về trang home
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ======================= */}
      {/* ROUTE DÀNH CHO KHÁCH  */}
      {/* ======================= */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <GuestRoute>
            <VerifyEmail />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* ======================= */}
      {/* ROUTE CẦN ĐĂNG NHẬP   */}
      {/* ======================= */}

      {/* Trang Dashboard/Home */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* 👇 CHỈ THÊM BLOCK NÀY: ĐÀO TẠO */}
      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <TrainingManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Nhu cầu tuyển dụng (HR Request) */}
      <Route
        path="/recruitment/needs"
        element={
          <ProtectedRoute>
            <HrRequestPage />
          </ProtectedRoute>
        }
      />

      {/* Kế hoạch tuyển dụng */}
      <Route
        path="/recruitment/plan"
        element={
          <ProtectedRoute>
            <RecruitmentPlanPage />
          </ProtectedRoute>
        }
      />

      {/* 👇 ROUTE MỚI: QUẢN LÝ ỨNG VIÊN */}
      <Route
        path="/recruitment/candidates"
        element={
          <ProtectedRoute>
            <CandidateManagementPage />
          </ProtectedRoute>
        }
      />

      {/* 👇 ROUTE ADMIN: QUẢN LÝ TÀI KHOẢN (Chỉ SUPER_ADMIN) */}
      {/* Quan trọng: Phải có dòng này thì mới vào được trang UserManagement */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      
      {/* Redirect tiện ích: gõ /admin tự nhảy về /admin/users */}
      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />

      {/* ======================= */}
      {/* ROUTE MẶC ĐỊNH        */}
      {/* ======================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;