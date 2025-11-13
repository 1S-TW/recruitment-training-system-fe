import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { assignRole } from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import "../../styles/editmodal.css";

/**
 * @param {object} props
 * @param {boolean} props.show
 * @param {Function} props.handleClose
 * @param {object} props.user - User đang được chọn
 * @param {string[]} props.availableRoles - Danh sách Role (['HR', 'QLDT', ...])
 * @param {Function} props.onSaveSuccess - Callback khi lưu thành công
 */
const EditUserModal = ({ show, handleClose, user, availableRoles, onSaveSuccess }) => {
  // State riêng cho role đang được chọn trong dropdown
  const [selectedRole, setSelectedRole] = useState(user.currentRoleName || '');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const { user: adminUser } = useAuth(); // Lấy thông tin admin đang đăng nhập

  // Cập nhật state nếu user prop thay đổi (khi mở modal mới)
  // Rất quan trọng để modal luôn hiển thị đúng thông tin
  useEffect(() => {
    if (user) {
      setSelectedRole(user.currentRoleName || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ngăn Admin tự tước quyền của chính mình
    if (adminUser && adminUser.email === user.email) {
       showNotification('Bạn không thể tự thay đổi role của chính mình.', 'error');
       return;
    }

    setLoading(true);
    
    // Kiểm tra xem role có thực sự thay đổi không
    if (selectedRole === (user.currentRoleName || '')) {
      showNotification('Bạn chưa thay đổi Role.', 'error');
      setLoading(false);
      return;
    }

    try {
      // Gọi API (chỉ gửi ID và Role mới)
      await assignRole(user.id, selectedRole);
      
      // Thông báo thành công (Yêu cầu 6)
      showNotification('Cập nhật role thành công!', 'success');

      // Gọi hàm callback về cha để cập nhật UI
      onSaveSuccess({ ...user, currentRoleName: selectedRole });

    } catch (err) {
      showNotification('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tránh render nếu không có user
  if (!user) return null;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      className="edit-user-modal"
    >

      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
          {/* Các trường thông tin chỉ đọc (disabled) - Yêu cầu 4 */}
          <Form.Group className="mb-3" controlId="formUserFullName">
            <Form.Label>Tên Người dùng</Form.Label>
            <Form.Control 
              type="text" 
              defaultValue={user.fullName}
              readOnly // Dùng readOnly thay vì disabled để UI đẹp hơn
              plaintext
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formUserEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control 
              type="email" 
              defaultValue={user.email} 
              readOnly
              plaintext
            />
          </Form.Group>

          {/* Trường Role (ĐƯỢC PHÉP SỬA) - Yêu cầu 5 */}
          <Form.Group className="mb-3" controlId="formUserRole">
            <Form.Label>Phân quyền (Role)</Form.Label>
            <Form.Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required // Bắt buộc phải chọn
            >
              <option value="">-- Chọn một Role --</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Form.Select>
          </Form.Group>

        </Modal.Body>
       <Modal.Footer>
          <Button className="btn" variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button className="btn btn--primary" variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Lưu Thay đổi'}
          </Button>
        </Modal.Footer>

      </Form>
    </Modal>
  );
};

export default EditUserModal;
