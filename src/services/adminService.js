import api from './api';

/**
 * Lấy danh sách TẤT CẢ user (cho Admin)
 * Backend API: GET /api/admin/users
 */
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

/**
 * Cập nhật role cho 1 user (cho Admin)
 * Backend API: PUT /api/admin/users/{userId}/role
 * @param {string} userId - ID của user (UUID)
 * @param {string} roleName - Role mới (ví dụ: "HR", "QLDT", hoặc "")
 */
export const assignRole = async (userId, roleName) => {


  const roleToSend = roleName || null;

  const response = await api.put(`/admin/users/${userId}/role`, { roleName: roleToSend });


  return response.data; // Trả về "Cập nhật role thành công."
};

/**
 * Lấy danh sách tất cả các Role có sẵn trong hệ thống
 */
export const getAvailableRoles = async () => {
  // Giả lập API gọi từ DataInitializer.java (Backend)
  // Đây là 4 roles chúng ta đã định nghĩa
  return Promise.resolve(['SUPER_ADMIN', 'LEAD', 'QLDT', 'HR']);
};