// src/pages/CandidateManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api"; // 👈 Dùng axios instance chung

// 1. IMPORT MODAL MỚI
import AddCandidateModal from "../components/AddCandidateModal";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";

import "../styles/request.css"; // Dùng chung
import "../styles/toast.css"; // Dùng chung
import "../styles/CandidateManagementPage.css"; // CSS riêng

export default function CandidateManagementPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kế hoạch tuyển dụng CONFIRMED cho dropdown
  // 🔹 State này sẽ lưu [{ id, name }]
  const [planOptions, setPlanOptions] = useState([]);

  // 2. THÊM STATE CHO MODAL
  const [showAddModal, setShowAddModal] = useState(false);

  // 🔹 3. Sửa hàm: Dùng 'api' (axios instance đã có token)
  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/candidates");
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải danh sách ứng viên:", e);
      setError("Không tải được danh sách ứng viên");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 4. Sửa hàm: Lấy plan TỪ API (giống RecruitmentPlanPage)
  const fetchConfirmedPlans = async () => {
    try {
      // Dùng 'api' (axios instance đã có token)
      // Gọi endpoint /approved (BE trả về List<PlanOptionDto> [{id, name}])
      const res = await api.get("/recruitment-plans/approved");
      setPlanOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải kế hoạch tuyển dụng CONFIRMED:", e);
      setPlanOptions([]);
    }
  };

  // Chạy 2 API khi tải trang
  useEffect(() => {
    fetchCandidates();
    fetchConfirmedPlans();
  }, []);

  // --- State cho Filter & Pagination ---
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // 🔹 5. Sửa: Filter bằng ID (planId) thay vì tên
  const [planFilter, setPlanFilter] = useState(""); // Sẽ lưu ID

  // --- Toast (giữ nguyên) ---
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // 🔹 6. Sửa: Filter ứng viên
  const filteredCandidates = useMemo(
    () =>
      (candidates || []).filter((c) => {
        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
          const name = (c.fullName || c.name || "").toLowerCase();
          const email = (c.email || "").toLowerCase();
          const phone = (c.phone || c.phoneNumber || "").toLowerCase();
          if (
            !name.includes(keyword) &&
            !email.includes(keyword) &&
            !phone.includes(keyword)
          ) {
            return false;
          }
        }

        if (statusFilter) {
          const status = (c.status || "").toLowerCase();
          if (status !== statusFilter.toLowerCase()) return false;
        }

        // 🔹 Sửa: Lọc theo planId
        if (planFilter) {
          // planFilter là ID (dạng string), c.recruitmentPlanId là number
          if (c.recruitmentPlanId?.toString() !== planFilter) {
            return false;
          }
        }

        return true;
      }),
    [candidates, searchTerm, statusFilter, planFilter]
  );

  // Sắp xếp (giữ nguyên)
  const filteredSorted = useMemo(
    () =>
      [...filteredCandidates].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }),
    [filteredCandidates]
  );

  // Phân trang (giữ nguyên)
  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCandidates = filteredSorted.slice(indexOfFirst, indexOfLast);

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

  // Actions (giữ nguyên)
  const handleViewCandidate = (candidate) => {
    console.log("Xem ứng viên:", candidate);
    showToast("Mở chi tiết ứng viên (TODO)", "success");
  };

  const handleEditCandidate = (candidate) => {
    console.log("Sửa ứng viên:", candidate);
    showToast("Mở form sửa ứng viên (TODO)", "success");
  };

  // 7. THÊM HÀM XỬ LÝ KHI TẠO THÀNH CÔNG
  const handleAddSuccess = (newCandidate) => {
    // Thêm ứng viên mới vào đầu danh sách (để user thấy ngay)
    setCandidates((prev) => [newCandidate, ...prev]);
    // Hiển thị thông báo
    showToast("Thêm ứng viên thành công!", "success");
    // Về trang 1
    setCurrentPage(1);
  };

  return (
    <Layout>
      {/* BREADCRUMB (giữ nguyên) */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">👤</span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Quản lý ứng viên</span>
        </div>
        <div className="breadcrumb-right">
          <div className="mini-pagination">
            <label className="mini-pagination-label">Hiển thị:</label>
            <select
              value={itemsPerPage}
              onChange={handleChangeItemsPerPage}
              className="mini-pagination-select"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý ứng viên</h2>

          {/* Thanh filter */}
          <div className="filter-bar candidate-filter-bar">
            {/* Search (giữ nguyên) */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="filter-icon">🔍</span>
            </div>

            {/* Trạng thái (giữ nguyên) */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Trạng thái...</option>
                <option value="Chưa có kết quả">Chưa có kết quả</option>
                <option value="Đã có kết quả">Đã có kết quả</option>
                <option value="Không nhận việc">Không nhận việc</option>
                {/* ... các option khác ... */}
              </select>
            </div>

            {/* 🔹 8. Sửa: Kế hoạch tuyển dụng (dùng ID) */}
            <div className="filter-item">
              <select
                className="filter-select candidate-plan-select"
                value={planFilter} // 👈 Sửa: value là planFilter (ID)
                onChange={(e) => {
                  setPlanFilter(e.target.value); // 👈 Sửa: set ID
                  setCurrentPage(1);
                }}
              >
                <option value="">Kế hoạch tuyển dụng...</option>
                {/* 🔹 Sửa: Lặp qua planOptions (đã chuẩn) */}
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔹 9. Sửa: Nút "Thêm ứng viên" */}
            <div className="filter-item filter-right-group">
              <button
                type="button"
                className="add-plan-btn clean" // Dùng style có sẵn
                onClick={() => setShowAddModal(true)} // 👈 Mở modal
              >
                ＋ Thêm ứng viên
              </button>
            </div>
          </div>
        </div>

        {/* TABLE (giữ nguyên) */}
        <div
          className={`table-container table-fade ${
            isAnimating ? "fade-out" : "fade-in"
          }`}
        >
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="text-center text-error">{error}</p>
          ) : filteredSorted.length === 0 ? (
            <p className="text-center">Không có ứng viên phù hợp.</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên ứng viên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Điểm Test (%)</th>
                  <th>Điểm PV</th>
                  <th>Trạng Thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentCandidates.map((c, index) => {
                  const stt = indexOfFirst + index + 1;
                  const name = c.fullName || c.name || "—";
                  const email = c.email || "—";
                  const phone = c.phone || c.phoneNumber || "—";
                  // 🔹 Sửa: Đảm bảo lấy đúng key (testScore, interviewScore)
                  const testScore = c.testScore ?? "—";
                  const interviewScore = c.interviewScore ?? "—";
                  const status = c.status || "Chưa có kết quả";

                  return (
                    <tr key={c.id || c.candidateId || stt}>
                      <td style={{ textAlign: "center" }}>{stt}</td>
                      <td>{name}</td>
                      <td style={{ textAlign: "left" }}>{email}</td>
                      <td style={{ textAlign: "center" }}>{phone}</td>
                      <td style={{ textAlign: "center" }}>{testScore}</td>
                      <td style={{ textAlign: "center" }}>{interviewScore}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="status-badge">{status}</span>
                      </td>
                      <td className="actions-cell text-center">
                        <div className="btn-action-wrapper">
                          <ActionButtons
                            onView={() => handleViewCandidate(c)}
                            onEdit={() => handleEditCandidate(c)}
                          />
                          <div className="action-tooltip">
                            Xem / sửa ứng viên
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION (giữ nguyên) */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 10. THÊM MODAL VÀO TRANG */}
      <AddCandidateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        planOptions={planOptions}
      />

      {/* TOAST (giữ nguyên) */}
      {toast && (
        <div
          className={`toast-container ${
            toast.type === "success" ? "toast-success" : "toast-error"
          }`}
          role="status"
        >
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}