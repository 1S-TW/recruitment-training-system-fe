// src/pages/TrainingManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import EditTrainingModal from "../components/EditTrainingModal"; // <-- import modal
import { FiSearch } from "react-icons/fi";
import "../styles/toast.css";
import "../styles/training.css";

// 🔹 NEW: Trợ lý AI
import AIAssistantBubble from "../components/AIAssistantBubble";


// Trả về class màu dựa trên trạng thái
const getStatusClass = (status) => {
  switch (status) {
    case "Đang thực tập":
      return "status-intern"; // màu xanh dương
    case "Đã hoàn thành":
      return "status-completed"; // màu xanh lá
    case "Đã dừng thực tập":
      return "status-stopped"; // màu đỏ
    default:
      return "status-unknown"; // màu xám
  }
};

// Trả về nhãn hiển thị, bạn có thể giữ nguyên text
const getStatusLabel = (status) => status || "Đang thực tập";

export default function TrainingManagementPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [internStatusFilter, setInternStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  // plan options (select kế hoạch)
  const [planOptions, setPlanOptions] = useState([]);

  // --- STATE MODAL ---
  const [editingTraining, setEditingTraining] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isViewOnly, setIsViewOnly] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

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

  useEffect(() => {
    const planId = searchParams.get("planId");
    const planName = searchParams.get("planName");

    if (!planId) return;

    setPlanFilter(planId);
    setCurrentPage(1);

    setPlanOptions((prev) => {
      const exists = prev.some((plan) => String(plan.id ?? plan.planId) === planId);
      if (exists) return prev;

      const fallbackName = planName || `Kế hoạch #${planId}`;
      const newPlan = {
        id: Number(planId) || planId,
        planId: Number(planId) || planId,
        name: fallbackName,
        planName: fallbackName,
      };

      return [newPlan, ...prev];
    });
  }, [searchParams]);

  const filteredTrainings = useMemo(
    () =>
      (trainings || []).filter((t) => {
        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
          const name = (
            t.traineeName ||
            t.fullName ||
            t.name ||
            ""
          ).toLowerCase();
          const email = (t.email || "").toLowerCase();
          const phone = (t.phoneNumber || t.phone || "").toLowerCase();
          if (
            !name.includes(keyword) &&
            !email.includes(keyword) &&
            !phone.includes(keyword)
          ) {
            return false;
          }
        }

        if (internStatusFilter) {
          const st = (t.internStatus || t.status || "").toLowerCase();
          if (!st.includes(internStatusFilter.toLowerCase())) return false;
        }

        if (planFilter) {
          const trainingPlanId =
            t.recruitmentPlanId ??
            t.planId ??
            t.recruitmentPlan?.id ??
            t.recruitmentPlan?.planId;

          if (trainingPlanId?.toString() !== planFilter) {
            return false;
          }
        }

        return true;
      }),
    [trainings, searchTerm, internStatusFilter, planFilter]
  );

  // giữ nguyên thứ tự API trả về
  const filteredSorted = useMemo(
    () => [...filteredTrainings],
    [filteredTrainings]
  );

  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTrainings = filteredSorted.slice(indexOfFirst, indexOfLast);

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

  const handleViewTraining = (training) => {
    setEditingTraining(training);
    setIsViewOnly(true); // Chỉ xem
    setIsEditModalOpen(true);
  };

  const handleEditTraining = (training) => {
    setEditingTraining(training);
    setIsViewOnly(false); // Có thể chỉnh sửa
    setIsEditModalOpen(true);
  };

  const handleSaveTraining = (updatedTraining) => {
    // merge vào object cũ, giữ nguyên thứ tự list
    setTrainings((prevTrainings) =>
      prevTrainings.map((t) =>
        t.internId === updatedTraining.internId
          ? { ...t, ...updatedTraining }
          : t
      )
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

      {/* NỘI DUNG CHÍNH */}
      <div className="training-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý đào tạo</h2>

          <div className="filter-bar candidate-filter-bar">
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
              <span className="filter-icon">
                <FiSearch />
              </span>
            </div>

            <div className="filter-item">
              <select
                className="filter-select"
                value={internStatusFilter}
                onChange={(e) => {
                  setInternStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Đang thực tập">Đang thực tập</option>
                <option value="Đã hoàn thành">Đã hoàn thành </option>
                <option value="Đã dừng thực tập">Đã dừng thực tập</option>
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
                  <option
                    key={plan.id || plan.planId}
                    value={String(plan.id ?? plan.planId)}
                  >
                    {plan.name ?? plan.planName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
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
            <table className="styled-table training-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên</th>
                  <th>Bắt đầu</th>
                  <th>Số ngày TT</th>
                  {/* CỘT MÔN HỌC DẠNG SCROLL */}
                  <th className="subject-col">
                    <div className="subject-header-row">
                      {(currentTrainings[0]?.scores || []).map((s, i) => (
                        <div key={i} className="subject-header-cell">
                          {s.courseName}
                        </div>
                      ))}

                      {(currentTrainings[0]?.scores?.length ?? 0) === 0 && (
                        <div className="subject-header-cell">Chưa có môn</div>
                      )}
                    </div>
                  </th>
                  <th>Tổng kết</th>
                  <th>Đánh giá trên team</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {currentTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center">
                      Không có bản ghi đào tạo phù hợp.
                    </td>
                  </tr>
                ) : (
                  currentTrainings.map((t, index) => {
                    const stt = indexOfFirst + index + 1;
                    const name = t.traineeName || t.fullName || t.name || "NA";
                    const startDate =
                      t.startDate || t.beginDate || t.trainingStartDate || null;
                    const internDays =
                      t.trainingDays ?? t.soNgayThucTap ?? t.soNgayTT ?? "NA";
                    const finalScore = t.finalScore ?? t.tongKet ?? "NA";
                    const teamEval = t.teamReview ?? t.danhGiaTeam ?? "NA";
                    const internStatus = t.internStatus || t.status || "NA";

                    return (
                      <tr key={t.internId || t.trainingId || t.id || stt}>
                        <td>{stt}</td>
                        <td>{name}</td>
                        <td>{formatDate(startDate)}</td>
                        <td>{internDays}</td>

                        <td className="subject-col">
                          <div className="subject-body-row">
                            {(t.scores || []).map((s, i) => (
                              <div key={i} className="subject-body-cell">
                                {s.totalScore != null
                                  ? Number(s.totalScore).toFixed(2)
                                  : "NA"}
                              </div>
                            ))}

                            {(t.scores?.length ?? 0) === 0 && (
                              <div className="subject-body-cell">NA</div>
                            )}
                          </div>
                        </td>
                        <td>
                          {t.summaryResult != null
                            ? Number(t.summaryResult).toFixed(2)
                            : "NA"}
                        </td>
                        <td>
                          {t.teamReview != null
                            ? Number(t.teamReview).toFixed(1)
                            : "NA"}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              t.internStatus
                            )}`}
                          >
                            {getStatusLabel(t.internStatus)}
                          </span>
                        </td>
                        <td className="actions-cell text-center">
                          <div className="btn-action-wrapper">
                            <ActionButtons
                              onView={() => handleViewTraining(t)}
                              onEdit={() => handleEditTraining(t)}
                              canEdit={
                                t.internStatus !== "Đã dừng thực tập" &&
                                t.internStatus !== "Đã hoàn thành"
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {filteredSorted.length > 0 && (
          <div className="pagination-bar">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

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
        )}
      </div>

      {/* MODAL CHỈNH SỬA ĐIỂM */}
      {isEditModalOpen && editingTraining && (
        <EditTrainingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          trainingData={editingTraining}
          onSave={handleSaveTraining}
          isViewOnly={isViewOnly} // <-- thêm prop
        />
      )}

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

      {/* 🔹 Trợ lý AI – bong bóng góc trái dưới */}
      <AIAssistantBubble trainings={trainings} planOptions={planOptions} />
    </Layout>
  );
}
