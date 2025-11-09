import React, { useEffect, useState, useMemo, useCallback } from 'react'; // 1. Thêm useCallback
import { Table, Button, Pagination, Form, Spinner as BootstrapSpinner, Badge, Card } from 'react-bootstrap';
import { getAllUsers, getAvailableRoles } from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
// 2. ĐẢM BẢO ĐƯỜNG DẪN NÀY ĐÚNG VỚI TÊN FILE CỦA BẠN
import EditUserModal from '../../components/admin/EditUserModal'; 

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        getAllUsers(),
        getAvailableRoles()
      ]);
      
      setUsers(usersData.sort((a, b) => {
        if (!a.currentRoleName && b.currentRoleName) return -1;
        if (a.currentRoleName && !b.currentRoleName) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }));
      setAvailableRoles(rolesData);

    } catch (err) {
      setError('Không thể tải danh sách tài khoản.');
      showNotification('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]); 

  // Tải dữ liệu khi component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // 3. Thêm fetchData vào dependency

  // (Phần code còn lại giữ nguyên)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handleShowModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSaveSuccess = (updatedUser) => {
    setUsers(currentUsers => 
      currentUsers.map(u => 
        u.id === updatedUser.id ? { ...u, currentRoleName: updatedUser.currentRoleName } : u
      )
    );
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <BootstrapSpinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <>
      <h1 className="h3 mb-4 text-dark">Quản lý Tài khoản</h1>
      <Card className="shadow-sm">
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>STT</th>
                <th>Tên Người dùng</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Role</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.status ? 
                      <Badge bg="success">Hoạt động</Badge> : 
                      <Badge bg="danger">Khóa</Badge>
                    }
                  </td>
                  <td>
                    {user.createdAt ? 
                      new Date(user.createdAt).toLocaleDateString('vi-VN') : 
                      'N/A'
                    }
                  </td>
                  <td>
                    {user.currentRoleName ? 
                      <Badge bg="primary">{user.currentRoleName}</Badge> :
                      <Badge bg="secondary">Chưa gán</Badge>
                    }
                  </td>
                  <td>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => handleShowModal(user)}
                    >
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <Form.Group controlId="itemsPerPageSelect" className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0">Hiển thị:</Form.Label>
          <Form.Select 
            style={{ width: '80px' }} 
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); 
            }}
          >
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Form.Select>
        </Form.Group>
        
        <Pagination>
          <Pagination.Prev 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
            disabled={currentPage === 1}
          />
          <Pagination.Item disabled>
            Trang {currentPage} / {totalPages}
          </Pagination.Item>
          <Pagination.Next 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>

      {selectedUser && (
        <EditUserModal 
          show={showModal}
          handleClose={handleCloseModal}
          user={selectedUser}
          availableRoles={availableRoles}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </>
  );
};

export default UserManagement;