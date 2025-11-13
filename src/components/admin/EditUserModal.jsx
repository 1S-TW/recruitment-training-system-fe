import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner as BootstrapSpinner, Alert } from 'react-bootstrap';
import { assignRole } from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Props:
 * - show: (boolean) Hiển thị modal hay không
 * - handleClose: (function) Hàm để đóng modal
 * - user: (object) Đối tượng user đang được sửa
 * - availableRoles: (string[]) Mảng các role (['SUPER_ADMIN', 'HR', ...])
 * - onSaveSuccess: (function) Hàm callback khi lưu thành công
 */
const EditUserModal = ({ show, handleClose, user, availableRoles, onSaveSuccess }) => {
  // Lấy user admin hiện tại từ context, để check xem có đang tự sửa mình không
  const { user: adminUser } = useAuth();
  const { showNotification } = useNotification();
  
  // State nội bộ của modal
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Yêu cầu (chỉn chu): Khi mở modal (hoặc user thay đổi),
  // state `selectedRole` phải được cập nhật theo user đó.
  useEffect(() => {
    if (user) {
      setSelectedRole(user.currentRoleName || ''); // Nếu user chưa có role, gán là chuỗi rỗng
    }
    setApiError(null); // Xóa lỗi cũ (nếu có)
  }, [user]); // Chạy lại mỗi khi 'user' (prop) thay đổi

  // Hàm xử lý khi nhấn nút "Lưu thay đổi"
  const handleSubmit = async () => {
    setLoading(true);
    setApiError(null);
    
    // Kiểm tra xem có đang tự sửa role của chính mình không
    if (adminUser.email === user.email) {
      setApiError('Bạn không thể tự thay đổi role của chính mình.');
      setLoading(false);
      return;
    }
    
    // Kiểm tra xem role có thực sự thay đổi không
    const originalRole = user.currentRoleName || '';
    if (selectedRole === originalRole) {
      handleClose(); // Nếu không đổi gì, chỉ cần đóng lại
      setLoading(false);
      return;
    }

    try {
      // Gọi API: PUT /api/admin/users/{userId}/role
      await assignRole(user.id, selectedRole);
      
      showNotification('Cập nhật role thành công!', 'success');
      
      // Báo cho component cha (UserManagement) biết là đã lưu
      // để cập nhật lại bảng mà không cần reload
      onSaveSuccess({ ...user, currentRoleName: selectedRole });

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Lỗi khi cập nhật role';
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // Kiểm tra an toàn, nếu không có user thì không render gì
  if (!user) return null;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa Role</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Hiển thị lỗi API nếu có */}
        {apiError && <Alert variant="danger">{apiError}</Alert>}

        <Form>
          {/* Yêu cầu: Các trường này ở chế độ "chỉ đọc" */}
          <Form.Group className="mb-3" controlId="formFullName">
            <Form.Label>Họ và Tên</Form.Label>
            <Form.Control type="text" value={user.fullName} readOnly disabled />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={user.email} readOnly disabled />
          </Form.Group>

          {/* Yêu cầu: Dropdown để chọn Role */}
          <Form.Group className="mb-3" controlId="formRole">
            <Form.Label>Phân Quyền (Role)</Form.Label>
            <Form.Select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              // Vô hiệu hóa nếu user đang tự sửa mình
              disabled={adminUser.email === user.email} 
            >
              <option value="">-- Chưa gán Role --</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading || (adminUser.email === user.email)}
        >
          {loading ? <BootstrapSpinner as="span" animation="border" size="sm" /> : 'Lưu thay đổi'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditUserModal;