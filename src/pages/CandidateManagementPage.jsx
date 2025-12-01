// src/pages/CandidateManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import AddCandidateModal from "../components/AddCandidateModal";
import AddResultModal from "../components/AddResultModal";

import { HiUserGroup } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import "../styles/request.css";
import "../styles/toast.css";
import "../styles/CandidateManagementPage.css";

// --- STATUS HELPER ---
const getStatusClass = (status) => {
  switch (status) {
    case "Chưa có kết quả":
      return "status-none";
    case "Đã có kết quả":
      return "status-done";
    case "Không nhận việc":
      return "status-refuse";
    case "Đã gửi mail cảm ơn":
      return "status-mail";
    case "Đã nhận việc":
      return "status-accept";
    case "Đã thông báo thời gian TT":
      return "status-inform";
    default:
      return "status-none";
  }
};

export default function CandidateManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [candidates, setCandidates] = useState([]);
  const [planOptions, setPlanOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- FILTER + PAGINATION STATE ---
  const [searchInput, setSearchInput] = useState(searchParams.get("name") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("name") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [planFilter, setPlanFilter] = useState(searchParams.get("plan") || "");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- MODAL STATE ---
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // --- TOAST ---
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // --- FETCH DATA ---
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

  const fetchPlans = async () => {
    try {
      const res = await api.get("/recruitment-plans/approved");
      setPlanOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải kế hoạch tuyển dụng:", e);
      setPlanOptions([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchPlans();
  }, []);

  // --- SYNC URL PARAMS WHEN PAGE LOAD ---
  useEffect(() => {
    setSearchInput(searchParams.get("name") || "");
    setSearchTerm(searchParams.get("name") || "");
    setStatusFilter(searchParams.get("status") || "");
    setPlanFilter(searchParams.get("plan") || "");
    setCurrentPage(Number(searchParams.get("page")) || 1);
  }, []);

  const updateSearchParams = ({ name, status, plan, page }) => {
    const newParams = {
      ...Object.fromEntries([...searchParams]),
      ...(name !== undefined ? { name } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(plan !== undefined ? { plan } : {}),
      ...(page !== undefined ? { page } : {}),
    };
    if (!newParams.name) delete newParams.name;
    if (!newParams.status) delete newParams.status;
    if (!newParams.plan) delete newParams.plan;
    if (!newParams.page) delete newParams.page;
    setSearchParams(newParams);
  };

  // --- DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      updateSearchParams({ name: searchInput, page: 1 });
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // --- FILTERED DATA ---
  const filteredCandidates = useMemo(() => {
    return (candidates || []).filter((c) => {
      const keyword = searchTerm.trim().toLowerCase();
      if (keyword) {
        const name = (c.fullName || c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || c.phoneNumber || "").toLowerCase();
        if (!name.includes(keyword) && !email.includes(keyword) && !phone.includes(keyword)) return false;
      }
      if (statusFilter) {
        if ((c.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      if (planFilter) {
        if (String(c.recruitmentPlanId) !== planFilter) return false;
      }
      return true;
    });
  }, [candidates, searchTerm, statusFilter, planFilter]);

  const filteredSorted = useMemo(() => [...filteredCandidates], [filteredCandidates]);
  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCandidates = filteredSorted.slice(indexOfFirst, indexOfLast);

  // --- HANDLERS ---
  const handleChangeItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
    updateSearchParams({ page: 1 });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      updateSearchParams({ page });
      setIsAnimating(false);
    }, 180);
  };

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setIsViewOnly(true);
    setShowEditModal(true);
  };

  const handleEditCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setIsViewOnly(false);
    setShowEditModal(true);
  };

  const handleAddSuccess = (newCandidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    showToast("Thêm ứng viên thành công!");
    setCurrentPage(1);
  };

  const handleEditSuccess = (updatedCandidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.candidateId === updatedCandidate.candidateId ? updatedCandidate : c))
    );
    setShowEditModal(false);
    showToast("Cập nhật ứng viên thành công!");
  };

  return (
    <Layout>
      {/* BREADCRUMB */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon"><HiUserGroup /></span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Quản lý ứng viên</span>
        </div>
      </div>

      <div className="recruitment-page candidate-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý ứng viên</h2>
          <div className="filter-bar candidate-filter-bar">
            {/* SEARCH */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="filter-icon"><FiSearch /></span>
            </div>

            {/* STATUS */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                  updateSearchParams({ status: e.target.value, page: 1 });
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Chưa có kết quả">Chưa có kết quả</option>
                <option value="Đã có kết quả">Đã có kết quả</option>
                <option value="Không nhận việc">Không nhận việc</option>
                <option value="Đã gửi mail cảm ơn">Đã gửi mail cảm ơn</option>
                <option value="Đã nhận việc">Đã nhận việc</option>
                <option value="Đã thông báo thời gian TT">Đã thông báo thời gian TT</option>
              </select>
            </div>

            {/* PLAN */}
            <div className="filter-item">
              <select
                className="filter-select candidate-plan-select"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                  updateSearchParams({ plan: e.target.value, page: 1 });
                }}
              >
                <option value="">Chọn kế hoạch tuyển dụng</option>
                {planOptions.map((plan) => (
                  <option key={plan.id || plan.planId} value={String(plan.id ?? plan.planId)}>
                    {plan.name ?? plan.planName}
                  </option>
                ))}
              </select>
            </div>

            {/* ADD BUTTON */}
            <div className="filter-item filter-right-group">
              <button type="button" className="add-plan-btn clean" onClick={() => setShowAddModal(true)}>
                ＋ Thêm ứng viên
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="text-center text-error">{error}</p>
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
                {currentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">Không có ứng viên phù hợp.</td>
                  </tr>
                ) : (
                  currentCandidates.map((c, i) => {
                    const stt = indexOfFirst + i + 1;
                    return (
                      <tr key={c.candidateId || stt}>
                        <td>{stt}</td>
                        <td>{c.fullName || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>{c.phoneNumber || "—"}</td>
                        <td>{c.testScore ?? "—"}</td>
                        <td>{c.interviewScore ?? "—"}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(c.status)}`}>
                            {c.status || "Chưa có kết quả"}
                          </span>
                        </td>
                        <td>
                          <ActionButtons
                            onView={() => handleViewCandidate(c)}
                            onEdit={() => handleEditCandidate(c)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {filteredSorted.length > 0 && (
          <div className="pagination-bar">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <div className="mini-pagination">
              <label className="mini-pagination-label">Hiển thị:</label>
              <select value={itemsPerPage} onChange={handleChangeItemsPerPage} className="mini-pagination-select">
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <AddCandidateModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          planOptions={planOptions}
        />
      )}

      {showEditModal && selectedCandidate && (
        <AddResultModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          candidate={selectedCandidate}
          isViewOnly={isViewOnly}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast-container ${toast.type === "success" ? "toast-success" : "toast-error"}`} role="status">
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
