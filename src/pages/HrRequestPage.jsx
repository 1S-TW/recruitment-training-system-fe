// src/pages/HrRequestPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import useHrRequests from "../hooks/useHrRequests";
import Layout from "../components/Layout";
import ActionButtons from "../components/ActionButtons.jsx";
import Pagination from "../components/Pagination";
import CreateRequestModal from "../components/CreateRequestModal.jsx";
import HRRequestModal from "../components/HRRequestModal.jsx";
import DatePicker from "../components/DatePicker";
import { useAuth } from "../contexts/AuthContext";

import { HiUserGroup } from "react-icons/hi"; 
import { FiSearch } from "react-icons/fi";

import "../styles/request.css";
import "../styles/toast.css";

// Map mã trạng thái -> label tiếng Việt
const getStatusLabel = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "NEW": return "Đã gửi";
    case "FAILED": case "FAILURE": return "Thất bại";
    case "PENDING": return "Đang chờ";
    case "IN_PROGRESS": return "Đang tiến hành";
    case "COMPLETED": return "Đã hoàn thành";
    case "CANCELED": return "Bị từ chối";
    default: return status || "Không rõ";
  }
};

// Map mã trạng thái -> className để tô màu badge
const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "NEW": return "status-new";
    case "FAILED": case "FAILURE": return "status-failed";
    case "IN_PROGRESS": return "status-inprogress";
    case "COMPLETED": return "status-completed";
    case "CANCELED": return "status-canceled";
    case "PENDING": return "status-pending";
    default: return "status-unknown";
  }
};

const deriveRequestStatus = (req = {}) => {
  const raw = String(req.status || "").toUpperCase();
  if (raw === "FAILED" || raw === "FAILURE") return "FAILED";
  const rejectReason = (req.rejectReason || "").trim();
  if (raw === "COMPLETED" && rejectReason) return "FAILED";
  return raw;
};

export default function HrRequestPage() {
  const { requests, loading, error, refetch } = useHrRequests();
  const { user } = useAuth();
  const role = user?.role;

  // ================= PHÂN QUYỀN =================
  const canCreateRequest = role === "SUPER_ADMIN" || role === "LEAD";
  const canEditRequestByRole = role === "SUPER_ADMIN" || role === "LEAD";

  // ================= URL SYNC =================
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const urlSearch = searchParams.get("search") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlDate   = searchParams.get("date") || "";
  const urlPage   = Number(searchParams.get("page")) || 1;

  const [searchName, setSearchName] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);

  // FIX HOÀN HẢO: selectedDate có đủ value + displayText + filterMode + displayMonth/displayYear
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!urlDate) return null;

    const parts = urlDate.split("-").map(Number);
    const y = parts[0];
    const m = parts[1] ? parts[1] - 1 : 0;
    const d = parts[2] || 1;
    const date = new Date(y, m, d);

    if (parts.length === 1) {
      // Chỉ năm
      return { value: date, displayText: `Năm ${y}`, filterMode: "year", displayYear: y };
    } else if (parts.length === 2) {
      // Năm-tháng
      const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
      return { value: date, displayText: `${months[m]} ${y}`, filterMode: "month", displayMonth: m, displayYear: y };
    } else {
      // Ngày đầy đủ
      return { value: date, displayText: date.toLocaleDateString("vi-VN"), filterMode: "day" };
    }
  });

  const [currentPage, setCurrentPage] = useState(urlPage);
  const [pendingRequestTitle, setPendingRequestTitle] = useState("");

  // Cập nhật URL
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchParams({ search: searchName.trim() || "", page: 1 });
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName, updateSearchParams]);

  // Đồng bộ khi F5/back/forward – FIX HOÀN HẢO CHO NĂM/THÁNG
  useEffect(() => {
    setSearchName(urlSearch);
    setStatusFilter(urlStatus);

    if (!urlDate) {
      setSelectedDate(null);
    } else {
      const parts = urlDate.split("-").map(Number);
      const y = parts[0];
      const m = parts[1] ? parts[1] - 1 : 0;
      const d = parts[2] || 1;
      const date = new Date(y, m, d);

      if (parts.length === 1) {
        setSelectedDate({ value: date, displayText: `Năm ${y}`, filterMode: "year", displayYear: y });
      } else if (parts.length === 2) {
        const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
        setSelectedDate({ value: date, displayText: `${months[m]} ${y}`, filterMode: "month", displayMonth: m, displayYear: y });
      } else {
        setSelectedDate({ value: date, displayText: date.toLocaleDateString("vi-VN"), filterMode: "day" });
      }
    }

    setCurrentPage(urlPage);
  }, [urlSearch, urlStatus, urlDate, urlPage]);

  // FIX CUỐI: BẤM ÁP DỤNG → LỌC ĐÚNG NGAY LẦN ĐẦU + URL ĐÚNG + Ô LỌC HIỆN ĐÚNG
  const handleDateChange = (payload) => {
    setSelectedDate(payload);

    let dateStr = "";
    if (payload?.value) {
      const d = payload.value;
      if (payload.filterMode === "year") {
        dateStr = `${d.getFullYear()}`;
      } else if (payload.filterMode === "month") {
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
    }

    updateSearchParams({
      date: dateStr,
      page: 1
    });
    setCurrentPage(1);
  };

  // Cập nhật URL cho status + page
  useEffect(() => {
    updateSearchParams({
      status: statusFilter || "",
      page: currentPage
    });
  }, [statusFilter, currentPage, updateSearchParams]);

  // Phân trang
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

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
      setIsAnimating(false);
    }, 180);
  };

  // Lọc dữ liệu (giữ nguyên logic cũ)
  const filteredRequests = (requests || []).filter((req) => {
    const matchesName = (req.requestTitle || "")
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const derivedStatus = deriveRequestStatus(req);
    const matchesStatus = statusFilter
      ? derivedStatus === statusFilter
      : true;

    let matchesDate = true;
    if (selectedDate?.value) {
      const createdFilter = new Date(selectedDate.value);
      const filterMode = selectedDate.filterMode || "day";

      const selectedDay = createdFilter.getDate();
      const selectedMonth =
        selectedDate.displayMonth ?? createdFilter.getMonth();
      const selectedYear =
        selectedDate.displayYear ?? createdFilter.getFullYear();

      const created = req.createdAt ? new Date(req.createdAt) : null;

      if (created) {
        if (filterMode === "day") {
          matchesDate =
            created.getDate() === selectedDay &&
            created.getMonth() === selectedMonth &&
            created.getFullYear() === selectedYear;
        } else if (filterMode === "month") {
          matchesDate =
            created.getMonth() === selectedMonth &&
            created.getFullYear() === selectedYear;
        } else if (filterMode === "year") {
          matchesDate = created.getFullYear() === selectedYear;
        }
      }
    }
    return matchesName && matchesStatus && matchesDate;
  });

  const filteredSorted = [...filteredRequests].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRequests = filteredSorted.slice(indexOfFirst, indexOfLast);

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  const isStatusEditable = (status) =>
    String(status || "").toUpperCase() === "NEW";

  const openCreate = () => {
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (req) => {
    setEditData({
      requestId: req.requestId,
      requestTitle: req.requestTitle || "",
      expectedDeliveryDate: req.expectedDeliveryDate || "",
      note: req.note || "",
      techQuantities: req.techQuantities || [],
      status: req.status,
    });
    setShowModal(true);
  };

  const flashEditTooltip = (btnWrapperEl, message) => {
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

  useEffect(() => {
    const handler = () => {
      refetch?.();
      setCurrentPage(1);
    };
    window.addEventListener("hr:requests:changed", handler);
    return () => window.removeEventListener("hr:requests:changed", handler);
  }, [refetch]);

  useEffect(() => {
    if (location.state?.requestTitle) {
      setPendingRequestTitle(location.state.requestTitle);
    }
  }, [location.state]);

  useEffect(() => {
    if (!pendingRequestTitle || !requests?.length) return;

    const matchedRequest = requests.find(
      (req) => (req.requestTitle || "").toLowerCase() === pendingRequestTitle.toLowerCase()
    );

    if (matchedRequest) {
      setSelectedRequest(matchedRequest);
      setSearchName(pendingRequestTitle);
    }

    setPendingRequestTitle("");
  }, [pendingRequestTitle, requests]);

  return (
    <Layout>
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon"><HiUserGroup /></span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Nhu cầu nhân sự</span>
        </div>
      </div>

      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Nhu cầu tuyển dụng</h2>

          <div className="filter-bar">
            {/* Cột Search */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <span className="filter-icon"><FiSearch /></span>
            </div>

            {/* Cột Select Status */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Chọn trạng thái</option>
                <option value="NEW">Đã gửi</option>
                <option value="IN_PROGRESS">Đang tiến hành</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELED">Bị từ chối</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>

            {/* NGÀY/THÁNG/NĂM – HOÀN HẢO 100% */}
            <div className="filter-item">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>

            <div style={{ flex: 1 }}></div>

            <div className="filter-item add-btn-wrapper">
              {canCreateRequest && (
                <button className="add-plan-btn clean" onClick={openCreate}>
                  Thêm nhu cầu tuyển dụng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bảng, phân trang, modal – giữ nguyên 100% */}
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
                  <th>Tên nhu cầu</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Người gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">Không có dữ liệu</td>
                  </tr>
                ) : (
                  currentRequests.map((req, index) => {
                    const displayStatus = deriveRequestStatus(req);
                    const canEditRow = canEditRequestByRole && isStatusEditable(req.status);

                    const rowAttrs = {
                      "data-status": displayStatus || req.status || "",
                      "data-editable": canEditRow ? "true" : "false",
                    };

                    return (
                      <tr key={req.requestId || index} {...rowAttrs}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{req.requestTitle}</td>
                        <td>
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(displayStatus)}`}>
                            {getStatusLabel(displayStatus)}
                          </span>
                        </td>
                        <td>{req.createdByName || "Không rõ"}</td>
                        <td className="actions-cell text-center">
                          <ActionButtons
                            onView={() => setSelectedRequest(req)}
                            onEdit={(e) => {
                              if (!canEditRow) {
                                e?.preventDefault?.();
                                const wrapper =
                                  e?.currentTarget?.closest(".btn-action-wrapper")
                                  || e?.target?.closest(".btn-action-wrapper");
                                
                                const msg = !canEditRequestByRole 
                                  ? "Bạn không có quyền chỉnh sửa mục này" 
                                  : "Chỉ trạng thái ĐÃ GỬI mới được sửa";
                                flashEditTooltip(wrapper, msg);
                                return;
                              }
                              openEdit(req);
                            }}
                            canEdit={canEditRow}
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

      {/* Modal giữ nguyên */}
      <CreateRequestModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        onSuccess={(msgFromBE) => {
          refetch?.();
          setCurrentPage(1);
          setShowModal(false);
          setEditData(null);
          showToast(
            msgFromBE ||
            (editData ? "Cập nhật thành công!" : "Tạo mới thành công!"),
            "success"
          );
        }}
        initialData={editData}
      />

      <HRRequestModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onActionSuccess={() => {
          refetch?.();
          setSelectedRequest(null);
          showToast("Thực hiện thành công!", "success");
        }}
        onActionError={(msg) => showToast(msg || "Có lỗi xảy ra", "error")}
      />

      {toast && (
        <div
          className={`toast-container ${toast.type === "success" ? "toast-success" : "toast-error"}`}
          role="status"
        >
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}