import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * "Người gác cổng" cho các trang cần bảo vệ
 * @param {{ allowedRoles: string[] }} props
 * allowedRoles: Mảng các role được phép (vd: ['SUPER_ADMIN'])
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // 1. Kiểm tra đã đăng nhập CHƯA?
  if (!isAuthenticated) {
    // Nếu chưa, đá về trang login
    // 'replace' để user không thể nhấn "Back" quay lại
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra có ĐÚNG ROLE không?
  // user.role (vd: 'SUPER_ADMIN') có nằm trong mảng allowedRoles không?
  const hasPermission = allowedRoles.includes(user?.role);

  if (!hasPermission) {
    // Nếu sai role (ví dụ: user 'HR' (nếu có) cố vào), đá về trang cấm
    return <Navigate to="/forbidden" replace />;
  }

  // 3. Nếu OK (đã đăng nhập VÀ đúng role), cho phép render trang con
  // <Outlet /> sẽ là <AdminLayout />
  return <Outlet />;
};

export default ProtectedRoute;