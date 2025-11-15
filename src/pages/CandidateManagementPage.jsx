// src/pages/CandidateManagementPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";

import "../styles/request.css";
import "../styles/toast.css";
import "../styles/CandidateManagementPage.css";

export default function CandidateManagementPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Kế hoạch tuyển dụng CONFIRMED cho dropdown
  const [planOptions, setPlanOptions] = useState([]);

  const API_CANDIDATES = "http://localhost:8080/api/candidates";
  const API_PLANS = "http://localhost:8080/api/recruitment-plans";

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API_CANDIDATES, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải danh sách ứng viên:", e);
      setError("Không tải được danh sách ứng viên");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lấy danh sách kế hoạch tuyển dụng đã CONFIRMED
  const fetchConfirmedPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API_PLANS, {
        params: { status: "CONFIRMED" },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      // res.data là mảng RecruitmentPlanResponse
      const names =
        Array.isArray(res.data) && res.data.length > 0
          ? res.data
              .map((p) => p.planName)
              .filter((x) => typeof x === "string" && x.trim() !== "")
          : [];

      setPlanOptions(names);
    } catch (e) {
      console.error("Lỗi tải kế hoạch tuyển dụng CONFIRMED:", e);
      setPlanOptions([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchConfirmedPlans(); // 🔸 gọi thêm API lấy kế hoạch CONFIRMED
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  // 🔍 Filter ứng viên theo search + status + kế hoạch
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
          const planName =
            c.recruitmentPlanName || c.recruitmentPlan?.planName || "";
          if (planName !== planFilter) return false;
        }

        return true;
      }),
    [candidates, searchTerm, statusFilter, planFilter]
  );

  // Sắp xếp theo createdAt (mới nhất trước)
  const filteredSorted = useMemo(
    () =>
      [...filteredCandidates].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }),
    [filteredCandidates]
  );

  // Phân trang
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
    showToast("Mở chi tiết ứng viên (TODO)", "success");
  };

  const handleEditCandidate = (candidate) => {
    console.log("Sửa ứng viên:", candidate);
    showToast("Mở form sửa ứng viên (TODO)", "success");
  };

  return (
    <Layout>
      {/* BREADCRUMB */}
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

          {/* Thanh filter giống HRRequestPage */}
          <div className="filter-bar candidate-filter-bar">
            {/* 1. Search */}
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

            {/* 2. Trạng thái ứng viên */}
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
                <option value="Đã gửi email cảm ơn">
                  Đã gửi email cảm ơn
                </option>
                <option value="Đã nhận việc">Đã nhận việc</option>
                <option value="Đã thông báo thời gian TT">
                  Đã thông báo thời gian TT
                </option>
              </select>
            </div>

            {/* 3. Kế hoạch tuyển dụng (lấy từ /api/recruitment-plans?status=CONFIRMED) */}
            <div className="filter-item">
              <select
                className="filter-select candidate-plan-select"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Kế hoạch tuyển dụng...</option>
                {planOptions.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            {/* Bên phải: nút Thêm ứng viên */}
            <div className="filter-item filter-right-group">
              <button
                type="button"
                className="add-plan-btn clean"
                onClick={() =>
                  showToast("Mở form thêm ứng viên (TODO)", "success")
                }
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
                  const testScore =
                    c.testScore ??
                    c.testPercent ??
                    c.test_score ??
                    "—";
                  const interviewScore =
                    c.interviewScore ??
                    c.interviewPoint ??
                    c.interview_score ??
                    "—";
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

        {/* PAGINATION */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* TOAST */}
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
