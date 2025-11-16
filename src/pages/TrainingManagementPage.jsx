// src/pages/TrainingManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api"; // axios instance chung

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";

import "../styles/request.css";
import "../styles/toast.css";
import "../styles/CandidateManagementPage.css"; // tái dùng style list ứng viên

export default function TrainingManagementPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- phân trang ---
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- filter: chỉ còn Search + dropdown thực tập ---
  const [searchTerm, setSearchTerm] = useState("");
  const [internStatusFilter, setInternStatusFilter] = useState("");

  // --- toast ---
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // ====== FETCH DATA (list đào tạo) ======
  // TODO: đổi endpoint này cho khớp BE của bạn (ví dụ /trainings hoặc /internships)
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

  useEffect(() => {
    fetchTrainings();
  }, []);

  // ====== FILTER + SORT ======
  const filteredTrainings = useMemo(
    () =>
      (trainings || []).filter((t) => {
        const keyword = searchTerm.trim().toLowerCase();

        // Search theo tên / email / sđt (đề phòng sau này cần)
        if (keyword) {
          const name = (t.traineeName || t.fullName || t.name || "").toLowerCase();
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

        // Lọc trạng thái thực tập
        if (internStatusFilter) {
          const st = (t.internStatus || t.status || "").toLowerCase();
          if (st !== internStatusFilter.toLowerCase()) return false;
        }

        return true;
      }),
    [trainings, searchTerm, internStatusFilter]
  );

  const filteredSorted = useMemo(
    () =>
      [...filteredTrainings].sort((a, b) => {
        // ưu tiên sort theo ngày bắt đầu
        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
        return db - da;
      }),
    [filteredTrainings]
  );

  // ====== PHÂN TRANG ======
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

  // ====== ACTION BUTTONS ======
  const handleViewTraining = (training) => {
    console.log("Xem đào tạo:", training);
    showToast("Mở chi tiết đào tạo (TODO)", "success");
  };

  const handleEditTraining = (training) => {
    console.log("Sửa đào tạo:", training);
    showToast("Mở form cập nhật đào tạo (TODO)", "success");
  };

  // helper format date dd/MM/yyyy
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <Layout>
      {/* BREADCRUMB giống list ứng viên nhưng đổi text + icon */}
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
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý đào tạo</h2>

          {/* FILTER BAR: chỉ 2 filter (Search + dropdown thực tập) */}
          <div className="filter-bar candidate-filter-bar">
            {/* 1) Search */}
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

            {/* 2) Dropdown trạng thái thực tập */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={internStatusFilter}
                onChange={(e) => {
                  setInternStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Trạng thái thực tập...</option>
                <option value="Đang thực tập">Đang thực tập</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
              </select>
            </div>

            {/* Không thêm filter thứ 3, không cần nút Thêm nếu bạn chưa yêu cầu */}
          </div>
        </div>

        {/* BẢNG DỮ LIỆU – layout giống list ứng viên nhưng cột đào tạo */}
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
                  <th>Tên</th>
                  <th>Bắt đầu</th>
                  <th>Số ngày TT</th>
                  <th>Môn học 1</th>
                  <th>Môn học 2</th>
                  <th>Môn học 3</th>
                  <th>Tổng kết</th>
                  <th>Đánh giá trên team</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center">
                      Không có bản ghi đào tạo phù hợp.
                    </td>
                  </tr>
                ) : (
                  currentTrainings.map((t, index) => {
                    const stt = indexOfFirst + index + 1;

                    // mapping field linh hoạt để phù hợp BE
                    const name =
                      t.traineeName || t.fullName || t.name || "—";
                    const startDate =
                      t.startDate || t.beginDate || t.trainingStartDate;
                    const internDays =
                      t.trainingDays || t.soNgayThucTap || t.soNgayTT || "—";
                    const subject1 =
                      t.subject1Score || t.monHoc1 || t.subject1 || "—";
                    const subject2 =
                      t.subject2Score || t.monHoc2 || t.subject2 || "—";
                    const subject3 =
                      t.subject3Score || t.monHoc3 || t.subject3 || "—";
                    const finalScore =
                      t.finalScore || t.tongKet || "—";
                    const teamEval =
                      t.teamEvaluation || t.danhGiaTeam || "—";

                    return (
                      <tr key={t.trainingId || t.id || stt}>
                        <td style={{ textAlign: "center" }}>{stt}</td>
                        <td>{name}</td>
                        <td style={{ textAlign: "center" }}>
                          {formatDate(startDate)}
                        </td>
                        <td style={{ textAlign: "center" }}>{internDays}</td>
                        <td style={{ textAlign: "center" }}>{subject1}</td>
                        <td style={{ textAlign: "center" }}>{subject2}</td>
                        <td style={{ textAlign: "center" }}>{subject3}</td>
                        <td style={{ textAlign: "center" }}>{finalScore}</td>
                        <td style={{ textAlign: "center" }}>{teamEval}</td>
                        <td className="actions-cell text-center">
                          <div className="btn-action-wrapper">
                            <ActionButtons
                              onView={() => handleViewTraining(t)}
                              onEdit={() => handleEditTraining(t)}
                            />
                            <div className="action-tooltip">
                              Xem / Cập nhật đào tạo
                            </div>
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

        {/* PAGINATION giống các trang khác */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* TOAST chung */}
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
