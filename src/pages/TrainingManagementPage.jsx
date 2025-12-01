// src/pages/TrainingManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import EditTrainingModal from "../components/EditTrainingModal";
import { FiSearch } from "react-icons/fi";
import "../styles/toast.css";
import "../styles/training.css";

// --- STATUS HELPER ---
const getStatusClass = (status) => {
  switch (status) {
    case "Đang thực tập":
      return "status-intern";
    case "Đã hoàn thành":
      return "status-completed";
    case "Đã dừng thực tập":
      return "status-stopped";
    default:
      return "status-unknown";
  }
};

const getStatusLabel = (status) => status || "Đang thực tập";

export default function TrainingManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get("name") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("name") || "");
  const [internStatusFilter, setInternStatusFilter] = useState(searchParams.get("status") || "");
  const [planFilter, setPlanFilter] = useState(searchParams.get("plan") || "");

  const [planOptions, setPlanOptions] = useState([]);

  // --- MODAL ---
  const [editingTraining, setEditingTraining] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // --- FETCH DATA ---
  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/trainings");
      setTrainings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải danh sách đào tạo:", e);
      setError("Không tải được danh sách đào tạo");
      setTrainings([]);
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
    fetchTrainings();
    fetchPlans();
  }, []);

  // --- UPDATE URL PARAMS ---
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
  const filteredTrainings = useMemo(
    () =>
      (trainings || []).filter((t) => {
        const keyword = searchTerm.trim().toLowerCase();
        if (keyword) {
          const name = (t.traineeName || t.fullName || t.name || "").toLowerCase();
          const email = (t.email || "").toLowerCase();
          const phone = (t.phoneNumber || t.phone || "").toLowerCase();
          if (!name.includes(keyword) && !email.includes(keyword) && !phone.includes(keyword)) return false;
        }
        if (internStatusFilter) {
          const st = (t.internStatus || t.status || "").toLowerCase();
          if (!st.includes(internStatusFilter.toLowerCase())) return false;
        }
        if (planFilter) {
          const planId =
            t.recruitmentPlan?.id ??
            t.recruitmentPlanId ??
            t.candidate?.recruitmentPlan?.id;

          if (String(planId) !== planFilter) return false;
        }

        return true;
      }),
    [trainings, searchTerm, internStatusFilter, planFilter]
  );

  const filteredSorted = useMemo(() => [...filteredTrainings], [filteredTrainings]);
  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTrainings = filteredSorted.slice(indexOfFirst, indexOfLast);

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

  const handleViewTraining = (training) => {
    setEditingTraining(training);
    setIsViewOnly(true);
    setIsEditModalOpen(true);
  };

  const handleEditTraining = (training) => {
    setEditingTraining(training);
    setIsViewOnly(false);
    setIsEditModalOpen(true);
  };

  const handleSaveTraining = (updatedTraining) => {
    setTrainings((prev) =>
      prev.map((t) => (t.internId === updatedTraining.internId ? { ...t, ...updatedTraining } : t))
    );
    showToast("Cập nhật điểm thành công!");
    setIsEditModalOpen(false);
  };

  const formatDate = (value) => {
    if (!value) return "NA";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "NA";
    return d.toLocaleDateString("vi-VN");
  };

  // --- SYNC URL PARAMS WHEN PAGE LOADS ---
  useEffect(() => {
    const urlName = searchParams.get("name") || "";
    const urlStatus = searchParams.get("status") || "";
    const urlPlan = searchParams.get("plan") || "";
    const urlPage = Number(searchParams.get("page")) || 1;

    setSearchInput(urlName);
    setSearchTerm(urlName);
    setInternStatusFilter(urlStatus);
    setPlanFilter(urlPlan);
    setCurrentPage(urlPage);
  }, []);

  return (
    <Layout>
      {/* BREADCRUMB */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">📚</span>
          <span className="breadcrumb-item">Đào tạo</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Quản lý đào tạo</span>
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="training-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý đào tạo</h2>

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
              <span className="filter-icon">
                <FiSearch />
              </span>
            </div>

            {/* STATUS */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={internStatusFilter}
                onChange={(e) => {
                  setInternStatusFilter(e.target.value);
                  setCurrentPage(1);
                  updateSearchParams({ status: e.target.value, page: 1 });
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Đang thực tập">Đang thực tập</option>
                <option value="Đã hoàn thành">Đã hoàn thành</option>
                <option value="Đã dừng thực tập">Đã dừng thực tập</option>
              </select>
            </div>

  
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
          </div>
        </div>

      {/* TABLE 3 PHẦN */}
      <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
        {loading ? (
          <p className="loading-text">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="text-center text-error">{error}</p>
        ) : (
          <div className="training-table-container">
            {/* Cột trái cố định */}
            <table className="training-table-fixed">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ tên</th>
                  <th>Bắt đầu</th>
                  <th>Số ngày TT</th>
                </tr>
              </thead>
              <tbody>
                {currentTrainings.map((t, i) => (
                  <tr key={t.internId || i}>
                    <td>{indexOfFirst + i + 1}</td>
                    <td>{t.traineeName || t.fullName || "NA"}</td>
                    <td>{formatDate(t.startDate || t.beginDate || t.trainingStartDate)}</td>
                    <td>{t.trainingDays ?? t.soNgayThucTap ?? t.soNgayTT ?? "NA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Scroll ngang môn */}
            <div className="training-table-scroll">
              <table>
                <thead>
                  <tr>
                    {(currentTrainings[0]?.scores || []).map((s, i) => (
                      <th key={i}>{s.courseName}</th>
                    ))}
                    {(currentTrainings[0]?.scores?.length ?? 0) === 0 && (
                      <th>Chưa có môn</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentTrainings.map((t, i) => (
                    <tr key={t.internId || i}>
                      {(t.scores || []).map((s, j) => (
                        <td key={j}>{s.totalScore != null ? Number(s.totalScore).toFixed(2) : "NA"}</td>
                      ))}
                      {(t.scores?.length ?? 0) === 0 && <td>NA</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cột phải cố định */}
            <table className="training-table-fixed training-table-fixed-right">
              <thead>
                <tr>
                  <th>Tổng kết</th>
                  <th>Đánh giá team</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentTrainings.map((t, i) => (
                  <tr key={t.internId || i}>
                    <td>{t.summaryResult != null ? Number(t.summaryResult).toFixed(2) : "NA"}</td>
                    <td>{t.teamReview != null ? Number(t.teamReview).toFixed(1) : "NA"}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(t.internStatus)}`}>
                        {getStatusLabel(t.internStatus)}
                      </span>
                    </td>
                    <td>
                      <ActionButtons
                        onView={() => handleViewTraining(t)}
                        onEdit={() => handleEditTraining(t)}
                        canEdit={t.internStatus !== "Đã dừng thực tập" && t.internStatus !== "Đã hoàn thành"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        
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

      {/* MODAL */}
      {isEditModalOpen && editingTraining && (
        <EditTrainingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          trainingData={editingTraining}
          onSave={handleSaveTraining}
          isViewOnly={isViewOnly}
        />
      )}

      {toast && (
        <div className={`toast-container ${toast.type === "success" ? "toast-success" : "toast-error"}`} role="status">
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
