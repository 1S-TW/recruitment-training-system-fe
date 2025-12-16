// src/pages/HrRequestPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons";
import CreateRequestModal from "../components/CreateRequestModal";
import HRRequestModal from "../components/HRRequestModal";
import DatePicker from "../components/DatePicker";
import { useAuth } from "../contexts/AuthContext";

import "../styles/plan.css"; 
import "../styles/request.css"; // ✅ Đảm bảo import đúng file CSS
import { HiUserGroup } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

// ✅ CẬP NHẬT: Thêm case COMPLETE và CANCEL với tên tiếng Việt CHUẨN
const getStatusLabel = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "NEW":
      return "Mới tạo";
    case "SENT":
      return "Đã gửi";
    case "IN_PROGRESS":
      return "Đang tiến hành";
    case "REJECTED":
      return "Bị từ chối";
      
    case "DONE":
    case "COMPLETED": 
      return "Đã hoàn thành"; // 👉 Đã sửa thành "Đã hoàn thành"
      
    case "CANCEL": 
    case "CANCELED":
      return "Đã hủy";        // 👉 Đã sửa thành "Đã hủy"
      
    default:
      return status || "Không rõ";
  }
};

// ✅ CẬP NHẬT: Map đúng class CSS cho màu sắc (Xanh lá / Đỏ)
const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "NEW":
      return "status-new";
    case "SENT":
    case "IN_PROGRESS":
      return "status-confirmed"; 
    case "REJECTED":
      return "status-rejected"; 
      
    case "DONE":
    case "COMPLETED":
      return "status-completed"; // ✅ Class này trong CSS là màu Xanh lá
      
    case "CANCEL":
    case "CANCELED":
      return "status-canceled";  // ✅ Class này trong CSS là màu Đỏ
      
    default:
      return "status-unknown";
  }
};

const HrRequestPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canCreate = role === "SUPER_ADMIN" || role === "LEAD";
  const canInteract = role !== "QLDT";
  const canApproveReject = role === "SUPER_ADMIN" || role === "HR";

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ====== URL PARAMS ======
  const urlSearch = searchParams.get("search") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlDate = searchParams.get("date") || "";
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlRequestTitle = searchParams.get("requestTitle") || "";

  // ====== STATE ======
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchName, setSearchName] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingRequestTitle, setPendingRequestTitle] = useState("");

  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: "http://localhost:8080",
    headers: { Authorization: `Bearer ${token}` },
  });

  // LOGIC DATE PICKER
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
    const params = new URLSearchParams(searchParams);
    if (dateStr) params.set("date", dateStr); else params.delete("date");
    params.set("page", "1");
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  useEffect(() => {
     if (urlRequestTitle) { setPendingRequestTitle(urlRequestTitle); setSearchName(urlRequestTitle); }
  }, [urlRequestTitle]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchName) params.set("search", searchName); else params.delete("search");
    if (statusFilter) params.set("status", statusFilter); else params.delete("status");
    if (pendingRequestTitle || urlRequestTitle) params.set("requestTitle", pendingRequestTitle || urlRequestTitle);
    params.set("page", "1");
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [searchName, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage !== urlPage) {
      params.set("page", String(currentPage));
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [currentPage]);

  useEffect(() => {
    if (!urlDate) { setSelectedDate(null); return; }
    const parts = urlDate.split("-").map(Number);
    const y = parts[0]; const m = parts[1] ? parts[1] - 1 : 0; const d = parts[2] || 1;
    const date = new Date(y, m, d);
    if (parts.length === 1) setSelectedDate({ value: date, displayText: `Năm ${y}`, filterMode: "year", displayYear: y });
    else if (parts.length === 2) setSelectedDate({ value: date, displayText: `Tháng ${parts[1]} ${y}`, filterMode: "month", displayMonth: m, displayYear: y });
    else setSelectedDate({ value: date, displayText: date.toLocaleDateString("vi-VN"), filterMode: "day" });
  }, [urlDate]);

  useEffect(() => {
    setSearchName(urlSearch); setStatusFilter(urlStatus); setCurrentPage(urlPage);
  }, [urlSearch, urlStatus, urlPage]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get("/api/hr-request");
      const list = res.data || [];
      setRequests(list); setFilteredRequests(list); setError(null);
    } catch (e) { console.error(e); setError("Không thể tải danh sách nhu cầu nhân sự"); } finally { setLoading(false); }
  };

  useEffect(() => { if (!token) { setError("Bạn chưa đăng nhập"); setLoading(false); return; } loadRequests(); }, []);

  const handleViewDetails = useCallback((req) => { setSelectedRequest(req); setIsDetailOpen(true); }, []);

  useEffect(() => {
    if (!pendingRequestTitle || !requests.length) return;
    const matched = requests.find((r) => (r.requestTitle || "").trim().toLowerCase() === pendingRequestTitle.trim().toLowerCase());
    if (matched) { handleViewDetails(matched); setPendingRequestTitle(""); }
  }, [pendingRequestTitle, requests, handleViewDetails]);

  useEffect(() => {
    let filtered = [...requests];
    if (searchName.trim()) filtered = filtered.filter((r) => (r.requestTitle || "").toLowerCase().includes(searchName.toLowerCase()));
    if (statusFilter) filtered = filtered.filter((r) => String(r.status || "").toUpperCase() === statusFilter);
    if (selectedDate?.value) {
       const filterMode = selectedDate.filterMode || "day";
       const selectedDay = selectedDate.value.getDate();
       const selectedMonth = selectedDate.displayMonth ?? selectedDate.value.getMonth();
       const selectedYear = selectedDate.displayYear ?? selectedDate.value.getFullYear();
       filtered = filtered.filter((r) => {
         const created = r.createdAt ? new Date(r.createdAt) : null;
         if (!created) return false;
         if (filterMode === "day") return created.getDate() === selectedDay && created.getMonth() === selectedMonth && created.getFullYear() === selectedYear;
         if (filterMode === "month") return created.getMonth() === selectedMonth && created.getFullYear() === selectedYear;
         if (filterMode === "year") return created.getFullYear() === selectedYear;
         return true;
       });
    }
    setFilteredRequests(filtered); setCurrentPage(1);
  }, [searchName, statusFilter, selectedDate, requests]);

  const filteredSorted = useMemo(() => [...filteredRequests].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)), [filteredRequests]);
  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const currentRequests = filteredSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleChangeItemsPerPage = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handlePageChange = (p) => { if (p < 1 || p > totalPages) return; setIsAnimating(true); setTimeout(() => { setCurrentPage(p); setIsAnimating(false); }, 180); };
  const openCreate = () => { setEditingRequest(null); setOpenCreateModal(true); };
  const handleEdit = (req) => { setEditingRequest(req); setOpenCreateModal(true); };
  const handleCreatedOrUpdated = async () => { await loadRequests(); };
  const handleCloseDetail = () => { setIsDetailOpen(false); setSelectedRequest(null); };

  return (
    <Layout>
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon"><HiUserGroup /></span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Nhu cầu tuyển dụng</span>
        </div>
      </div>

      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Nhu cầu tuyển dụng</h2>

          <div className="filter-bar">
            {/* Search */}
            <div className="filter-item">
              <input type="text" className="filter-input" placeholder="Tìm theo tên..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
              <span className="filter-icon"><FiSearch /></span>
            </div>

            {/* ✅ CẬP NHẬT: Select filter hiển thị "Đã hoàn thành" và "Đã hủy" */}
            <div className="filter-item">
              <select className="filter-select smooth-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Chọn trạng thái</option>
                <option value="NEW">Mới tạo</option>
                <option value="SENT">Đã gửi</option>
                <option value="IN_PROGRESS">Đang tiến hành</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="COMPLETED">Đã hoàn thành</option> 
                <option value="CANCEL">Đã hủy</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="filter-item">
              <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
            </div>

            <div style={{ flex: 1 }} />
            {canCreate && (
              <div className="filter-item add-btn-wrapper">
                <button className="add-plan-btn modern-add" onClick={openCreate}>Thêm nhu cầu nhân sự</button>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className={`table-container ${isAnimating ? "fade-out" : "fade-in"}`}>
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
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
                  <tr><td colSpan="6" className="text-center">Không có dữ liệu</td></tr>
                ) : (
                  currentRequests.map((req, idx) => (
                    <tr key={req.requestId || idx}>
                      <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td>{req.requestTitle}</td>
                      <td>{req.createdAt ? formatDate(req.createdAt) : "—"}</td>
                      <td>
                        {/* ✅ Gọi hàm getStatusClass và getStatusLabel đã cập nhật */}
                        <span className={`status-badge ${getStatusClass(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </td>
                      <td>{req.createdBy?.fullName || req.createdByName || "Không rõ"}</td>
                      <td className="actions-cell text-center">
                        <div style={!canInteract ? { pointerEvents: "none", opacity: 0.4, cursor: "not-allowed" } : {}} title={!canInteract ? "Bạn không có quyền thao tác" : ""}>
                          <ActionButtons 
                            onView={() => handleViewDetails(req)} 
                            onEdit={() => handleEdit(req)} 
                            canEdit={(role === "LEAD" || role === "SUPER_ADMIN") && String(req.status || "").toUpperCase() === "NEW"} 
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

      <CreateRequestModal isOpen={openCreateModal} onClose={() => setOpenCreateModal(false)} onSuccess={handleCreatedOrUpdated} initialData={editingRequest} />
      <HRRequestModal isOpen={isDetailOpen} onClose={handleCloseDetail} request={selectedRequest} canApproveReject={canApproveReject} onStatusChange={loadRequests} />
    </Layout>
  );
};

export default HrRequestPage;