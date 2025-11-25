// src/pages/RecruitmentPlanPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import AddPlanModal from "../components/AddPlanModal";
import DatePicker from "../components/DatePicker";
import Modal from "../components/Modal";
import "../styles/plan.css";
import { HiUserGroup } from "react-icons/hi"; 
import { FiSearch } from "react-icons/fi";
const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const getStatusLabel = (status) => {
  switch (status) {
    case "NEW":
      return "Mới tạo";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return status || "Không rõ";
  }
};

const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "NEW":
      return "status-new";
    case "CONFIRMED":
      return "status-confirmed";
    case "REJECTED":
      return "status-rejected";
    default:
      return "status-unknown";
  }
};

// 🔹 TÍNH TÊN "NGƯỜI GỬI" CHO TỪNG KẾ HOẠCH
// - Ưu tiên: người từ chối kế hoạch (rejectedByName) nếu trạng thái REJECTED/CANCELED
// - Còn lại: người tạo nhu cầu (request.createdBy.fullName / createdByName)
const getSenderName = (plan) => {
  if (!plan) return "Không rõ";

  const status = (plan.status || "").toUpperCase();

  const createdByName =
    plan.request?.createdBy?.fullName ||
    plan.request?.createdByName ||
    "";

  const rejectedByName = plan.rejectedByName || "";

  if (status === "REJECTED" || status === "CANCELED") {
    return rejectedByName || createdByName || "Không rõ";
  }

  return createdByName || "Không rõ";
};



const RecruitmentPlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [techSummary, setTechSummary] = useState([]);
  const [requestTitle, setRequestTitle] = useState("");
  const [modalMode, setModalMode] = useState("select");
  const [requestOptions, setRequestOptions] = useState([]);

  const [form, setForm] = useState({
    requestId: undefined,
    planName: "",
    status: "NEW",
    recruitmentDeadline: "",
    deliveryDeadline: "",
    note: "",
  });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalStep, setModalStep] = useState(0);
  const [rejectReason, setRejectReason] = useState("");

  const location = useLocation();
  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: "http://localhost:8080",
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get("/api/recruitment-plans");
      setPlans(res.data);
      setFilteredPlans(res.data);
      setError(null);
    } catch {
      setError("❌ Không thể tải danh sách kế hoạch tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("⚠️ Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }
    loadPlans();
  }, []);

  // Mở AddPlan từ URL ?requestId=...
  useEffect(() => {
  let filtered = [...plans];

  if (searchName.trim()) {
    filtered = filtered.filter((p) =>
      (p.planName || "").toLowerCase().includes(searchName.toLowerCase())
    );
  }

  if (statusFilter) {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

  if (selectedDate?.value) {
    const createdFilter = new Date(selectedDate.value);
    const filterMode = selectedDate.filterMode || "day";

    const selectedDay = createdFilter.getDate();
    const selectedMonth = selectedDate.displayMonth ?? createdFilter.getMonth();
    const selectedYear = selectedDate.displayYear ?? createdFilter.getFullYear();

    filtered = filtered.filter((p) => {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      if (!created) return false;

      if (filterMode === "day") {
        return (
          created.getDate() === selectedDay &&
          created.getMonth() === selectedMonth &&
          created.getFullYear() === selectedYear
        );
      } else if (filterMode === "month") {
        return (
          created.getMonth() === selectedMonth &&
          created.getFullYear() === selectedYear
        );
      } else if (filterMode === "year") {
        return created.getFullYear() === selectedYear;
      }

      return true;
    });
  }

  setFilteredPlans(filtered);
  setCurrentPage(1);
}, [searchName, statusFilter, selectedDate, plans]);


     const filteredSorted = [...filteredPlans].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirst, indexOfLast);

  const handleChangeItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(p);
      setIsAnimating(false);
    }, 180);
  };

  const openEmptyAddModal = async () => {
    setForm({
      requestId: undefined,
      planName: "",
      status: "NEW",
      recruitmentDeadline: "",
      deliveryDeadline: "",
      note: "",
    });
    setTechSummary([]);
    setRequestTitle("");
    setModalMode("select");

    try {
      const res = await axiosAuth.get("/api/hr-request");
      const opts = (res.data || [])
        .filter((r) => String(r.status || "").toUpperCase() === "NEW")
        .map((r) => ({ id: r.requestId, title: r.requestTitle }))
        .sort((a, b) => a.title.localeCompare(b.title));
      setRequestOptions(opts);
    } catch {
      setRequestOptions([]);
    }
    setOpenAddModal(true);
  };

  const handlePickRequest = async (id) => {
    if (!id) {
      setForm((f) => ({
        ...f,
        requestId: undefined,
        recruitmentDeadline: "",
        deliveryDeadline: "",
      }));
      setTechSummary([]);
      setRequestTitle("");
      return;
    }
    try {
      const res = await axiosAuth.get(`/api/hr-request/${id}/plan-defaults`);
      const d = res.data;
      setForm({
        requestId: d.requestId,
        planName: "",
        status: d.status || "NEW",
        recruitmentDeadline: d.recruitmentDeadline || "",
        deliveryDeadline: d.deliveryDeadline || "",
        note: d.note || "",
      });
      setRequestTitle(d.suggestedPlanName || d.requestTitle || "");
      setTechSummary(d.techQuantities || []);
    } catch {
      setForm((f) => ({
        ...f,
        requestId: undefined,
        recruitmentDeadline: "",
        deliveryDeadline: "",
      }));
      setTechSummary([]);
      setRequestTitle("");
    }
  };

  // ====== TẠO KẾ HOẠCH ======
  const submitPlan = async () => {
    try {
      if (!form.requestId) {
        alert("⚠️ Vui lòng chọn nhu cầu trước khi tạo kế hoạch.");
        return;
      }
      if (!form.planName || !form.recruitmentDeadline || !form.deliveryDeadline) {
        alert("⚠️ Vui lòng nhập tên kế hoạch và thời hạn.");
        return;
      }

      await axiosAuth.post("/api/recruitment-plans", form);
      try {
        await axiosAuth.put(`/api/hr-request/${form.requestId}/approve?note=`);
      } catch (err) {
        console.error("Không thể cập nhật trạng thái nhu cầu:", err);
      }

      window.dispatchEvent(new Event("hr:requests:changed"));
      setOpenAddModal(false);
      await loadPlans();
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Lỗi không xác định";
      alert(`⚠️ Không thể tạo kế hoạch: ${msg}`);
    }
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setModalStep(1);
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    const planId = selectedPlan.recruitmentPlanId;

    try {
      const res = await axiosAuth.put(
        `/api/recruitment-plans/${planId}/confirm`
      );
      const updated = res.data;

      setPlans((prev) =>
        prev.map((p) => (p.recruitmentPlanId === planId ? updated : p))
      );
      setFilteredPlans((prev) =>
        prev.map((p) => (p.recruitmentPlanId === planId ? updated : p))
      );
      setSelectedPlan(updated);

      window.dispatchEvent(new Event("hr:requests:changed"));
    } catch (error) {
      console.error("Lỗi khi phê duyệt kế hoạch:", error);
    }
  };

  const handleStartReject = () => {
    setModalStep(3);
    setRejectReason("");
  };

  const handleCloseModal = () => {
    setModalStep(0);
    setSelectedPlan(null);
    setRejectReason("");
  };

  const handleSubmitRejection = async () => {
    if (!selectedPlan) return;
    const planId = selectedPlan.recruitmentPlanId;

    if (!planId || !rejectReason.trim()) {
      alert("Lý do từ chối không được để trống.");
      return;
    }

    try {
      const formattedReason = `Kế hoạch tuyển dụng: ${rejectReason.trim()}`;
      const res = await axiosAuth.post(
        `/api/recruitment-plans/${planId}/reject`,
        { rejectionReason: formattedReason }
      );

      const updated = res.data;

      setPlans((prev) =>
        prev.map((p) => (p.recruitmentPlanId === planId ? updated : p))
      );
      setFilteredPlans((prev) =>
        prev.map((p) => (p.recruitmentPlanId === planId ? updated : p))
      );
      setSelectedPlan(updated);

      window.dispatchEvent(new Event("hr:requests:changed"));

      handleCloseModal();
    } catch (error) {
      console.error("Lỗi khi từ chối:", error);
    }
  };

  const renderPlanDetails = (plan, showStatus = false) => {
    if (!plan) return null;

    const request = plan.request;
    if (!request) {
      return (
        <p className="error-text">
          Lỗi: Kế hoạch này thiếu thông tin nhu cầu (request).
        </p>
      );
    }

    const techRows = request.quantityCandidates || [];

    return (
      <div className="detail-list">
        <div className="detail-item">
          <span className="detail-label">Tên nhu cầu:</span>
          <span className="detail-value">{request.requestTitle}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tên kế hoạch:</span>
          <span className="detail-value">{plan.planName}</span>
        </div>

        <table className="tech-table">
          <thead>
            <tr>
              <th>Công nghệ</th>
              <th className="text-center">Đầu ra (SL)</th>
              <th className="text-center">Đầu vào (SL)</th>
            </tr>
          </thead>
          <tbody>
            {techRows.length > 0 ? (
              techRows.map((qc) => (
                <tr key={qc.technology.id}>
                  <td>{qc.technology.name}</td>
                  <td className="text-center">{qc.soLuong}</td>
                  <td className="text-center">{qc.soLuong * 2}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Không có thông tin công nghệ.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="detail-item">
          <span className="detail-label">Thời hạn tuyển dụng:</span>
          <span className="detail-value">
            {formatDate(plan.recruitmentDeadline)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Thời hạn bàn giao:</span>
          <span className="detail-value">
            {formatDate(plan.deliveryDeadline)}
          </span>
        </div>

        {showStatus && (
          <div className="detail-item">
            <span className="detail-label">Trạng thái:</span>
            <span className="detail-value status-confirmed">
              {getStatusLabel(plan.status)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
            <span className="breadcrumb-icon"><HiUserGroup /></span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Kế hoạch tuyển dụng</span>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

         <div className="filter-bar">
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

            <div className="filter-item">
              <select
                className="filter-select smooth-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Chọn trạng thái</option>
                <option value="NEW">Mới tạo</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
            </div>

            <div className="filter-item">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            <div className="filter-item add-btn-wrapper">
              <button
                className="add-plan-btn modern-add"
                onClick={openEmptyAddModal}
              >
                ＋ Thêm kế hoạch tuyển dụng
              </button>
            </div>
          </div>
        </div>

        {/* Bảng */}
        <div
          className={`table-container ${
            isAnimating ? "fade-out" : "fade-in"
          }`}
        >
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên kế hoạch</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Người gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentPlans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  currentPlans.map((plan, index) => (
                    <tr key={plan.recruitmentPlanId || index}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{plan.planName}</td>
                      <td>
                        {plan.createdAt ? formatDate(plan.createdAt) : "—"}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(plan.status)}`}>
                    {getStatusLabel(plan.status)}
                        </span>
                      </td>
                      {/* 🔹 CỘT NGƯỜI GỬI – ĐÃ SỬA DÙNG getSenderName */}
                      <td>{getSenderName(plan)}</td>
                      <td className="actions-cell text-center">
                        <ActionButtons
                          onView={() => handleViewDetails(plan)}
                          onEdit={() => {}}
                        />
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

      {/* Modal tạo kế hoạch */}
      <AddPlanModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        form={form}
        onChange={setForm}
        onSubmit={submitPlan}
        techSummary={techSummary}
        requestTitle={requestTitle}
        mode={modalMode}
        requestOptions={requestOptions}
        onPickRequest={handlePickRequest}
      />

      {/* Modal Xem/Sửa/Từ chối */}
      {modalStep === 1 && selectedPlan && (
        <Modal
          title="Chi tiết Kế hoạch tuyển dụng"
          onClose={handleCloseModal}
          width={640}
        >
          {renderPlanDetails(selectedPlan, false)}

          {selectedPlan.status === "NEW" ? (
            <div className="modal-footer modal-footer-actions">
              <button
                className="modal-btn btn-reject"
                onClick={handleStartReject}
              >
                Từ chối
              </button>
              <button
                className="modal-btn btn-approve btn-approve-green"
                onClick={handleApprove}
              >
                Phê duyệt
              </button>
            </div>
          ) : selectedPlan.status === "CANCELED" ||
            selectedPlan.status === "REJECTED" ? (
            <div className="rejection-card">
              <p className="rejection-title">
                LÝ DO KẾ HOẠCH BỊ{" "}
                {selectedPlan.status === "CANCELED" ? "HỦY" : "TỪ CHỐI"}:
              </p>
              <p className="rejection-reason-text">
                {selectedPlan.note || "Không có lý do cụ thể được ghi lại."}
              </p>
              <div className="modal-footer justify-end" />
            </div>
          ) : (
            <div className="modal-footer justify-center only-view-footer">
              <p className="only-view-text">
                Kế hoạch đang ở trạng thái "
                {getStatusLabel(selectedPlan.status)}". Chỉ có thể xem.
              </p>
            </div>
          )}
        </Modal>
      )}

      {/* Modal Reject Reason */}
      {modalStep === 3 && selectedPlan && (
        <Modal
          title="Lý do Từ chối Kế hoạch"
          onClose={handleCloseModal}
          width={520}
        >
          <div className="reject-form">
            <label htmlFor="rejectReason" className="reject-label">
              Vui lòng nhập lý do từ chối kế hoạch:{" "}
              <span className="reject-plan-name">
                "{selectedPlan.planName}"
              </span>
            </label>
            <textarea
              id="rejectReason"
              className="reject-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
            />
          </div>
          <div className="modal-footer modal-footer-actions">
            <button
              className="modal-btn btn-secondary"
              onClick={handleCloseModal}
            >
              Hủy
            </button>
            <button
              className="modal-btn btn-reject"
              onClick={handleSubmitRejection}
              disabled={!rejectReason.trim()}
            >
              Xác nhận từ chối
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default RecruitmentPlanPage;
