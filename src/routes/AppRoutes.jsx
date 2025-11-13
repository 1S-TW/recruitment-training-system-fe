import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// --- Components ---
import ProtectedRoute from '../components/ProtectedRoute';

// --- Pages ---
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import HomePage from '../pages/HomePage';
import HRRequestPage from '../pages/HRRequestPage';
import RecruitmentPlanPage from '../pages/RecruitmentPlanPage';
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import ForbiddenPage from '../pages/ForbiddenPage';

// --- Admin Pages ---
import UserManagement from '../pages/admin/UserManagement';

/**
 * "GuestRoute" ngăn user đã đăng nhập xem lại trang Login/Register
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    // Nếu đã đăng nhập, tự động điều hướng
    return <Navigate to={isAdmin ? "/admin" : "/forbidden"} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ========================================= */}
      {/* == CÁC ROUTE CÔNG KHAI (KHÁCH) == */}
      {/* ========================================= */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/verify" element={<GuestRoute><VerifyEmail /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* ========================================= */}
      {/* == CÁC ROUTE ĐƯỢC BẢO VỆ (USER) == */}
      {/* ========================================= */}
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

      {/* Trang Kế hoạch tuyển dụng */}
      <Route
        path="/recruitment/plan"
        element={
          <ProtectedRoute>
            <RecruitmentPlanPage />
          </ProtectedRoute>
        }
      />

      {/* ========================================= */}
      {/* == CÁC ROUTE CỦA ADMIN (ĐƯỢC BẢO VỆ) == */}
      {/* ========================================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <UserManagement/>
          </ProtectedRoute>
        }
      >
        {/* URL: /admin (Trang chủ Admin, mặc định là Quản lý User) */}
        <Route index element={<Navigate to="user-management" replace />} />
        <Route path="user-management" element={<UserManagement />} />
      </Route>

      {/* ========================================= */}
      {/* == ROUTE MẶC ĐỊNH (NẾU GÕ SAI) == */}
      {/* ========================================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
