// src/pages/CandidateManagementPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

import AddCandidateModal from "../components/AddCandidateModal";
import AddResultModal from "../components/AddResultModal";
import DatePicker from "../components/DatePicker";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import { useAuth } from "../contexts/AuthContext";

import "../styles/toast.css";
import "../styles/CandidateManagementPage.css";
import { HiUserGroup } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";

/**
 * Bộ lọc ngày phỏng vấn (Từ - Đến)
 */
function InterviewDateFilter({ from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);

  useEffect(() => {
    if (open) {
      setTempFrom(from);
      setTempTo(to);
    }
  }, [open, from, to]);

  const formatDate = (payload) => {
    if (!payload?.value) return "...";
    const d = new Date(payload.value);
    return isNaN(d.getTime()) ? "..." : d.toLocaleDateString("vi-VN");
  };

  const displayLabel =
    from?.value || to?.value
      ? `Ngày PV: ${formatDate(from)} → ${formatDate(to)}`
      : "Ngày PV (từ - đến)";

  return (
    <div className="filter-item range-filter">
      <button
        type="button"
        className="filter-select range-filter-toggle"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="range-filter-label">{displayLabel}</span>
      </button>

      {open && (
        <div className="range-popover">
          <div className="range-row">
            <span className="range-row-label">Từ:</span>
            <DatePicker selectedDate={tempFrom || null} onDateChange={setTempFrom} />
          </div>

          <div className="range-row">
            <span className="range-row-label">Đến:</span>
            <DatePicker selectedDate={tempTo || null} onDateChange={setTempTo} />
          </div>

          <div className="range-footer">
            <button
              type="button"
              className="range-btn range-btn-clear"
              onClick={() => {
                onChange({ from: null, to: null });
                setOpen(false);
              }}
            >
              Xóa
            </button>
            <button
              type="button"
              className="range-btn range-btn-ok"
              onClick={() => {
                onChange({ from: tempFrom, to: tempTo });
                setOpen(false);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateManagementPage() {
  const { user } = useAuth();
  const role = user?.role;

  const canAddCandidate = role === "SUPER_ADMIN" || role === "HR";
  const canInteract = role !== "LEAD";

  const [searchParams, setSearchParams] = useSearchParams();

  const urlName   = searchParams.get("name")   || "";
  const urlStatus = searchParams.get("status") || "";
  const urlPlan   = searchParams.get("plan")   || "";
  const urlFrom   = searchParams.get("from")   || "";
  const urlTo     = searchParams.get("to")     || "";
  const urlPage   = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(urlName);
  const [searchTerm, setSearchTerm]   = useState(urlName);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [planFilter, setPlanFilter]     = useState(urlPlan);
  const [interviewFrom, setInterviewFrom] = useState(urlFrom ? { value: urlFrom } : null);
  const [interviewTo, setInterviewTo]     = useState(urlTo ? { value: urlTo } : null);
  const [currentPage, setCurrentPage]     = useState(urlPage);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planOptions, setPlanOptions] = useState([]);
  const [prefilledPlan, setPrefilledPlan] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateSearchParams = useCallback((updates) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    });
  }, [setSearchParams]);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        updateSearchParams({ name: searchInput.trim() || "", page: 1 });
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  },[searchInput, searchTerm, updateSearchParams]);

  // ĐỒNG BỘ KHI URL THAY ĐỔI (F5, back/forward)
  useEffect(() => {
    setSearchInput(urlName);
    setSearchTerm(urlName);
    setStatusFilter(urlStatus);
    setPlanFilter(urlPlan);
    setInterviewFrom(urlFrom ? { value: urlFrom } : null);
    setInterviewTo(urlTo ? { value: urlTo } : null);
    setCurrentPage(urlPage);
  }, [urlName, urlStatus, urlPlan, urlFrom, urlTo, urlPage]);

  // LƯU PARAM MẶC ĐỊNH NGAY LẦN ĐẦU NẾU URL SẠCH
  useEffect(() => {
    const hasAnyParam = searchParams.has("name") ||
                        searchParams.has("status") ||
                        searchParams.has("plan") ||
                        searchParams.has("from") ||
                        searchParams.has("to") ||
                        searchParams.has("page");

    if (!hasAnyParam) {
      updateSearchParams({ page: 1 });
    }
  }, [searchParams, updateSearchParams]);

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

  // PREFILL PLAN TỪ URL
  useEffect(() => {
    const planId = searchParams.get("planId");
    const planName = searchParams.get("planName");

    if (planId && !urlPlan) {
      setPlanFilter(planId);
      updateSearchParams({ plan: planId });
      if (planName) {
        setPrefilledPlan({ id: planId, name: planName });
      }
    }
  }, [searchParams, urlPlan, updateSearchParams]);

  const normalizePlan = (raw) => {
    const id = raw.id ?? raw.recruitmentPlanId ?? raw.planId ?? null;
    const name = raw.name ?? raw.planName ?? raw.title ?? "Kế hoạch không tên";
    return { id, name };
  };

  const planSelectOptions = useMemo(() => {
    const normalized = planOptions
      .map(normalizePlan)
      .filter((plan) => plan.id !== null && plan.id !== undefined);

    if (
      prefilledPlan &&
      !normalized.some((plan) => String(plan.id) === String(prefilledPlan.id))
    ) {
      return [...normalized, prefilledPlan];
    }

    return normalized;
  }, [planOptions, prefilledPlan]);

  const getDateRange = (payload) => {
    if (!payload?.value) return null;
    const base = new Date(payload.value);
    if (isNaN(base.getTime())) return null;

    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();

    return {
      start: new Date(year, month, day, 0, 0, 0, 0),
      end: new Date(year, month, day, 23, 59, 59, 999),
    };
  };

  const filteredCandidates = useMemo(() => {
    const fromRange = getDateRange(interviewFrom);
    const toRange   = getDateRange(interviewTo);

    return (candidates || []).filter((c) => {
      const keyword = searchTerm.trim().toLowerCase();
      if (keyword) {
        const name = (c.fullName || c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || c.phoneNumber || "").toLowerCase();
        if (!name.includes(keyword) && !email.includes(keyword) && !phone.includes(keyword)) {
          return false;
        }
      }

      if (statusFilter) {
        const status = (c.status || "").toLowerCase();
        if (status !== statusFilter.toLowerCase()) return false;
      }

      if (planFilter) {
        if (c.recruitmentPlanId?.toString() !== planFilter) return false;
      }

      const interviewValue = c.interviewDate || c.interview_date;
      if ((fromRange || toRange) && !interviewValue) return false;

      if (interviewValue && (fromRange || toRange)) {
        const interviewDate = new Date(interviewValue);
        if (isNaN(interviewDate.getTime())) return false;
        if (fromRange && interviewDate < fromRange.start) return false;
        if (toRange && interviewDate > toRange.end) return false;
      }

      return true;
    });
  }, [candidates, interviewFrom, interviewTo, planFilter, searchTerm, statusFilter]);

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

  const handleStatusChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    updateSearchParams({ status: val || "", page: 1 });
    setCurrentPage(1);
  };

  const handlePlanChange = (e) => {
    const val = e.target.value;
    setPlanFilter(val);
    updateSearchParams({ plan: val || "", page: 1 });
    setCurrentPage(1);
  };

  const handleDateRangeChange = ({ from, to }) => {
    setInterviewFrom(from);
    setInterviewTo(to);

    const fromStr = from?.value ? new Date(from.value).toISOString().split("T")[0] : "";
    const toStr   = to?.value   ? new Date(to.value).toISOString().split("T")[0]   : "";

    updateSearchParams({
      from: fromStr,
      to: toStr,
      page: 1
    });
    setCurrentPage(1);
  };

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowEditModal(true);
  };

  const handleEditCandidate = (candidate) => {
    if (!canInteract) return;
    setSelectedCandidate(candidate);
    setShowEditModal(true);
  };

  const handleAddSuccess = (newCandidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setCurrentPage(1);
  };

  const handleEditSuccess = (updatedCandidate) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidateId === updatedCandidate.candidateId ? updatedCandidate : c
      )
    );
    setShowEditModal(false);
  };

  const getStatusClass = (status) => {
    const map = {
      "Chưa có kết quả": "status-none",
      "Đã có kết quả": "status-done",
      "Không nhận việc": "status-refuse",
      "Đã gửi mail cảm ơn": "status-mail",
      "Đã nhận việc": "status-accept",
      "Đã hẹn ngày thực tập": "status-inform",
    };
    return map[status] || "status-none";
  };

  const flashEditTooltip = (btnWrapperEl, message = "Bạn không có quyền thực hiện thao tác này") => {
    const tip = btnWrapperEl?.querySelector(".action-tooltip");
    if (!tip) return;
    const original = tip.textContent;
    tip.textContent = message;
    tip.style.opacity = "1";
    tip.style.transform = "translateX(-50%) scale(1)";
    setTimeout(() => {
      tip.textContent = original;
      tip.removeAttribute("style");
    }, 1500);
  };

  return (
    <Layout>
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">
            <HiUserGroup />
          </span>
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

      <div className="candidate-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý ứng viên</h2>
          <div className="filter-bar candidate-filter-bar">
            {/* Search */}
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

            {/* Trạng thái */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Chưa có kết quả">Chưa có kết quả</option>
                <option value="Đã có kết quả">Đã có kết quả</option>
                <option value="Không nhận việc">Không nhận việc</option>
                <option value="Đã gửi mail cảm ơn">Đã gửi mail cảm ơn</option>
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
                onChange={handlePlanChange}
              >
                <option value="">Chọn kế hoạch tuyển dụng</option>
                {planSelectOptions.map((plan) => (
                  <option key={plan.id} value={`${plan.id}`}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gộp bộ lọc ngày phỏng vấn vào 1 filter */}
            <InterviewDateFilter
              from={interviewFrom}
              to={interviewTo}
              onChange={handleDateRangeChange}
            />

            {/* Nút Thêm ứng viên: Chỉ HR & Admin thấy */}
            <div className="filter-item filter-right-group">
              {canAddCandidate && (
                <button
                  type="button"
                  className="add-plan-btn clean"
                  onClick={() => setShowAddModal(true)}
                >
                  Thêm ứng viên
                </button>
              )}
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
                        <td style={{ textAlign: "center" }}>
                          {interviewScore}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className={`status-badge ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="actions-cell text-center">
                          <ActionButtons
                            onView={() => handleViewCandidate(c)}
                            onEdit={(e) => {
                              if (!canInteract) {
                                e?.preventDefault?.();
                                const wrapper =
                                  e?.currentTarget?.closest(
                                    ".btn-action-wrapper"
                                  ) ||
                                  e?.target?.closest(".btn-action-wrapper");
                                flashEditTooltip(
                                  wrapper,
                                  "Bạn không có quyền chỉnh sửa"
                                );
                                return;
                              }
                              handleEditCandidate(c);
                            }}
                            canEdit={canInteract}
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