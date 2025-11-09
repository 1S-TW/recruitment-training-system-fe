import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- Components ---
import ProtectedRoute from './ProtectedRoute';

// --- Layouts ---
import AdminLayout from '../components/Layout/AdminLayout'; 

// --- Pages ---
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
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
      <Route
        path="/login"
        element={<GuestRoute><Login /></GuestRoute>}
      />
      <Route
        path="/register"
        element={<GuestRoute><Register /></GuestRoute>}
      />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/verify" element={<GuestRoute><VerifyEmail /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* ========================================= */}
      {/* == CÁC ROUTE CỦA ADMIN (ĐƯỢC BẢO VỆ) == */}
      {/* ========================================= */}
      <Route 
        path="/admin" 
        element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}
      >
        {/* Tất cả các trang admin sẽ dùng chung layout này */}
        <Route element={<AdminLayout />}>
          {/* URL: /admin (Trang chủ Admin, mặc định là Quản lý User) */}
          <Route index element={<Navigate to="user-management" replace />} />
          
          {/* URL: /admin/user-management */}
          <Route path="user-management" element={<UserManagement />} />
          
          {/* (Sau này bạn có thể thêm các route khác ở đây) */}
          {/* <Route path="course-management" element={<...>} /> */}
        </Route>
      </Route>

      {/* Trang mặc định (nếu gõ sai) */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
};

export default AppRoutes;