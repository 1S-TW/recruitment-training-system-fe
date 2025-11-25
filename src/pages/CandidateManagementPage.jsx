// src/pages/CandidateManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api"; // Dùng axios instance chung

import AddCandidateModal from "../components/AddCandidateModal";
import AddResultModal from "../components/AddResultModal";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";

import "../styles/request.css";
import "../styles/toast.css";
import "../styles/CandidateManagementPage.css";
import { HiUserGroup } from "react-icons/hi"; 
import { FiSearch } from "react-icons/fi";
export default function CandidateManagementPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planOptions, setPlanOptions] = useState([]);

  // --- State cho 2 Modal ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

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

  const fetchConfirmedPlans = async () => {
    try {
      const res = await api.get("/recruitment-plans/approved");
      setPlanOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải kế hoạch tuyển dụng CONFIRMED:", e);
      setPlanOptions([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchConfirmedPlans();
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  // ✅ ĐÃ XÓA: State 'toast' và hàm 'showToast'

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
        if (planFilter) {
          if (c.recruitmentPlanId?.toString() !== planFilter) {
            return false;
          }
        }
        return true;
      }),
    [candidates, searchTerm, statusFilter, planFilter]
  );

  const filteredSorted = useMemo(
    () =>
      [...filteredCandidates].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }),
    [filteredCandidates]
  );

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

  const handleViewCandidate = (candidate) => {
    console.log("Xem ứng viên:", candidate);
    // ✅ ĐÃ XÓA: showToast("Mở chi tiết ứng viên (TODO)", "success");
  };

  const handleEditCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowEditModal(true);
  };

  const handleAddSuccess = (newCandidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    // ✅ ĐÃ XÓA: showToast("Thêm ứng viên thành công!", "success");
    setCurrentPage(1);
  };

  const handleEditSuccess = (updatedCandidate) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidateId === updatedCandidate.candidateId ? updatedCandidate : c
      )
    );
    setShowEditModal(false);
    // ✅ ĐÃ XÓA: showToast("Chấm điểm thành công!", "success");
  };

  return (
    <Layout>
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon"><HiUserGroup /></span>
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

      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý ứng viên</h2>
          <div className="filter-bar candidate-filter-bar">
            {/* Search */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
               <span className="filter-icon"><FiSearch /></span>
            </div>

            {/* Trạng thái */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Chưa có kết quả">Chưa có kết quả</option>
                <option value="Đã có kết quả">Đã có kết quả</option>
                <option value="Không nhận việc">Không nhận việc</option>
                <option value="Đã gửi mail cảm ơn">
                  Đã gửi mail cảm ơn
                </option>
                <option value="Đã nhận việc">Đã nhận việc</option>
                <option value="Đã thông báo thời gian TT">
                  Đã thông báo thời gian TT
                </option>
              </select>
            </div>

            {/* Kế hoạch tuyển dụng */}
            <div className="filter-item">
              <select
                className="filter-select candidate-plan-select"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn kế hoạch tuyển dụng</option>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Thêm ứng viên */}
            <div className="filter-item filter-right-group">
              <button
                type="button"
                className="add-plan-btn clean"
                onClick={() => setShowAddModal(true)}
              >
                ＋ Thêm ứng viên
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div
          className={`table-container table-fade ${
            isAnimating ? "fade-out" : "fade-in"
          }`}
        >
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
                    <td colSpan={8} className="text-center">
                      Không có ứng viên phù hợp.
                    </td>
                  </tr>
                ) : (
                  currentCandidates.map((c, index) => {
                    const stt = indexOfFirst + index + 1;
                    const name = c.fullName || "—";
                    const email = c.email || "—";
                    const phone = c.phoneNumber || "—";
                    const testScore = c.testScore ?? "—";
                    const interviewScore = c.interviewScore ?? "—";
                    const status = c.status || "Chưa có kết quả";

                    return (
                      <tr key={c.candidateId || stt}>
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
                          {/* Đã bỏ div wrapper thừa ở đây theo yêu cầu trước */}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal Thêm */}
      <AddCandidateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        planOptions={planOptions}
      />

      {/* Modal Sửa/Chấm điểm */}
      <AddResultModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        candidate={selectedCandidate}
      />


    </Layout>
  );
}