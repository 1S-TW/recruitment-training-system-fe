import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { UserCog,  Edit3 } from "lucide-react";
import { getAllUsers, getAvailableRoles } from "../../services/adminService";
import { useNotification } from "../../contexts/NotificationContext";
import EditUserModal from "../../components/admin/EditUserModal";
import Pagination from "../../components/Pagination";
import "../../styles/admin.css"; // Reuse CSS from request page

export default function UserManagement() {
  const { showNotification } = useNotification();

  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, rolesData] = await Promise.all([
          getAllUsers(),
          getAvailableRoles(),
        ]);
        setUsers(usersData);
        setAvailableRoles(rolesData);
      } catch (err) {
        showNotification("Không thể tải danh sách tài khoản!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showNotification]);

  // --- Filter ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesName = u.fullName
        ?.toLowerCase()
        .includes(searchName.toLowerCase());
      const matchesRole = roleFilter ? u.currentRoleName === roleFilter : true;
      return matchesName && matchesRole;
    });
  }, [users, searchName, roleFilter]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  const handleChangeItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsAnimating(false);
    }, 180);
  };

  const handleShowModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSaveSuccess = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === updatedUser.id
          ? { ...u, currentRoleName: updatedUser.currentRoleName }
          : u
      )
    );
    handleCloseModal();
  };

  return (
    <Layout>
      {/* === Breadcrumb === */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <div className="breadcrumb-icon-wrapper">
            <UserCog size={18} strokeWidth={2} />
          </div>
          <span className="breadcrumb-item">Quản lý người dùng</span>
        </div>

        <div className="breadcrumb-right">
          <div className="mini-pagination">
            <label className="mini-pagination-label">Hiển thị:</label>
            <select
              value={itemsPerPage}
              onChange={handleChangeItemsPerPage}
              className="mini-pagination-select smooth-dropdown"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="user-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Danh sách tài khoản</h2>

          {/* --- Bộ lọc --- */}
          <div className="filter-bar">
            {/* 🔍 Tìm theo tên */}
            <div className="filter-item search-wrapper">
              <div className="search-input-container">
                <input
                  type="text"
                  className="filter-input search-input"
                  placeholder="Tìm theo tên người dùng..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <span className="filter-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="7" cy="7" r="5" />
                    <line x1="11" y1="11" x2="15" y2="15" />
                  </svg>
                </span>
              </div>
            </div>

            {/* 🎭 Lọc theo role */}
            <div className="filter-item">
              <select
                className="filter-select smooth-dropdown"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Tất cả vai trò</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔁 Nút reset */}
            <div className="filter-item clear-filters-wrapper">
              <button
                className="clear-filters-btn modern-reset"
                onClick={(e) => {
                  const btn = e.currentTarget.querySelector(".icon-refresh");
                  btn.classList.add("spin-click");
                  setTimeout(() => btn.classList.remove("spin-click"), 600);
                  setSearchName("");
                  setRoleFilter("");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="icon-refresh"
                >
                  <path
                    d="M21 12a9 9 0 1 1-3-6.7M21 8v4h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* === Table === */}
        <div
          className={`table-container table-fade ${
            isAnimating ? "fade-out" : "fade-in"
          }`}
        >
          <table className="styled-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                currentUsers.map((u, index) => (
                  <tr key={u.id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          u.status ? "active" : "inactive"
                        }`}
                      >
                        {u.status ? "Hoạt động" : "Khóa"}
                      </span>
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span className="status-badge role-badge">
                        {u.currentRoleName || "Chưa gán"}
                      </span>
                    </td>
                    <td className="actions-cell text-center">
                      <div className="btn-action-wrapper">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleShowModal(u)}
                          data-tooltip="Chỉnh sửa"
                        >
                          <Edit3 size={18} />
                        </button>
                        <span className="action-tooltip">Chỉnh sửa</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* === Pagination === */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* === Modal chỉnh sửa user === */}
      {selectedUser && (
        <EditUserModal
          show={showModal}
          handleClose={handleCloseModal}
          user={selectedUser}
          availableRoles={availableRoles}
          onSaveSuccess={handleSaveSuccess}
        />

      )}
    </Layout>
  );
}