// src/pages/RecruitmentPlanPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButton"; // ✅ Import đã có
import Modal from "../components/Modal"; // ✅ Thêm import Modal
import "../styles/plan.css";

// Hàm helper định dạng ngày
const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const RecruitmentPlanPage = () => {

  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  // ... (các state khác giữ nguyên) ...
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- 💎 MODAL STATE ---
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalStep, setModalStep] = useState(0); // 0: closed, 1: view, 2: approved, 3: reject
  const [rejectReason, setRejectReason] = useState("");
  // --- (Hết) MODAL STATE ---

  useEffect(() => {
    // ... (Phần fetch data giữ nguyên) ...
    const token = localStorage.getItem("token");
    if (!token) {
      setError("⚠️ Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }

    axios
      .get("http://localhost:8080/api/recruitment-plans", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Log dữ liệu để kiểm tra cấu trúc
        console.log("Data fetched:", res.data);
        
        setPlans(res.data);
        setFilteredPlans(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("❌ Không thể tải danh sách kế hoạch tuyển dụng");
      })
      .finally(() => setLoading(false));
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    // ... (Phần filter logic giữ nguyên) ...
    let filtered = [...plans];
    if (searchName.trim()) {
      filtered = filtered.filter((p) =>
        p.planName?.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((p) =>
        p.createdAt?.startsWith(dateFilter)
      );
    }
    setFilteredPlans(filtered);
    setCurrentPage(1);
  }, [searchName, statusFilter, dateFilter, plans]);

  // ... (các hàm handleChangeItemsPerPage, handlePageChange giữ nguyên) ...
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirst, indexOfLast);

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

  // --- 💎 MODAL HANDLERS ---
  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setModalStep(1); // Mở modal xem chi tiết (bước 1)
  };

  const handleApprove = () => {
    setModalStep(2); // Chuyển sang modal đã duyệt (bước 2)
  };

  const handleStartReject = () => {
    setModalStep(3); // Chuyển sang modal từ chối (bước 3)
    setRejectReason(""); // Reset lý do
  };

  // src/pages/RecruitmentPlanPage.jsx (Thay thế hàm handleSubmitRejection)
const handleCloseModal = () => {
    setModalStep(0);
    setSelectedPlan(null);
};

const handleSubmitRejection = async () => { 
    const planId = selectedPlan.recruitmentPlanId;
    const token = localStorage.getItem("token");

    if (!planId || !rejectReason.trim()) {
        alert("Lý do từ chối không được để trống.");
        return;
    }

    try {
        const response = await axios.post(
            `http://localhost:8080/api/recruitment-plans/${planId}/reject`, 
            { rejectionReason: rejectReason }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(response.data.message);
        
        // ✅ CẬP NHẬT TRẠNG THÁI CỤC BỘ (LƯU VÀO TRƯỜNG 'note')
        const updatedPlanData = { status: 'CANCELED', note: rejectReason }; 

        setPlans(prevPlans => prevPlans.map(p => 
            p.recruitmentPlanId === planId 
                ? { ...p, ...updatedPlanData }
                : p
        ));
        setFilteredPlans(prevFilteredPlans => prevFilteredPlans.map(p => 
            p.recruitmentPlanId === planId 
                ? { ...p, ...updatedPlanData }
                : p
        ));
        setSelectedPlan(prevPlan => ({ 
            ...prevPlan, 
            ...updatedPlanData 
        }));
        
        handleCloseModal();

    } catch (error) {
        console.error("Lỗi khi từ chối:", error);
        alert(error.response?.data?.error || "Lỗi không xác định khi từ chối.");
    }
};
  // --- (Hết) MODAL HANDLERS ---

  // --- 💎 RENDER COMPONENTS CHO MODAL ---
  // Component nội dung chi tiết (dùng cho cả bước 1 và 2)
  const renderPlanDetails = (plan, showStatus = false) => {
    if (!plan) return null;

    const request = plan.request; // request lồng trong plan
    if (!request) {
      console.error("Plan không có 'request' object:", plan);
      return <p className="error-text">Lỗi: Kế hoạch này thiếu thông tin 'request'.</p>
    }

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
        
        {/* Bảng công nghệ */}
        <table className="tech-table">
          <thead>
            <tr>
              <th>Công nghệ</th>
              <th className="text-center">Đầu ra (SL)</th>
              <th className="text-center">Đầu vào (SL)</th>
            </tr>
          </thead>
          <tbody>
            {request.quantityCandidates && request.quantityCandidates.length > 0 ? (
              request.quantityCandidates.map((qc) => (
                <tr key={qc.technology.id}>
                  <td>{qc.technology.name}</td>
                  <td className="text-center">{qc.soLuong}</td>
                  <td className="text-center">{qc.soLuong * 2}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="text-center">Không có thông tin công nghệ.</td></tr>
            )}
          </tbody>
        </table>

        <div className="detail-item">
          <span className="detail-label">Thời hạn tuyển dụng:</span>
          <span className="detail-value">{formatDate(plan.createdAt)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Thời hạn bàn giao:</span>
          <span className="detail-value">{formatDate(plan.deliveryDeadline)}</span>
        </div>

        {showStatus && (
          <div className="detail-item">
            <span className="detail-label">Trạng thái:</span>
            <span className="detail-value status-confirmed">ĐÃ XÁC NHẬN</span>
          </div>
        )}
      </div>
    );
  };
  // --- (Hết) RENDER COMPONENTS ---

  return (
    <Layout>
      {/* === Breadcrumb === */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">💼</span>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Kế hoạch tuyển dụng</span>
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

      {/* === CONTENT === */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

          <div className="filter-bar">
            {/* Search theo tên */}
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <span className="filter-icon">🔍</span>
            </div>

            {/* Trạng thái */}
            <div className="filter-item">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELED">Đã hủy</option>
              </select>
            </div>

            {/* Ngày tạo */}
            <div className="filter-item">
              <input
                type="date"
                className="filter-date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Nút thêm kế hoạch */}
            <button
              className="add-plan-btn clean"
              onClick={() => console.log("Thêm kế hoạch tuyển dụng")}
            >
              ＋ Thêm kế hoạch tuyển dụng
            </button>
          </div>
        </div>

        {/* === Table === */}
        <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
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
                {Array.isArray(currentPlans) && currentPlans.length > 0 ? (
        // Logic map chỉ chạy khi currentPlans chắc chắn là mảng và có dữ liệu
        currentPlans.map((plan, index) => (
            <tr key={plan.recruitmentPlanId || index}>
                <td>{indexOfFirst + index + 1}</td>
                <td>{plan.planName}</td>
                <td>{formatDate(plan.createdAt)}</td>
                <td>
                    <span className="status-badge">{plan.status}</span>
                </td>
                <td>
                    {plan.request?.createdBy?.fullName ||
                      plan.request?.createdBy?.username ||
                      "Không rõ"}
                </td>
                <td className="actions-cell text-center">
                    <ActionButtons
                      onView={() => handleViewDetails(plan)}
                      onEdit={() => console.log("Chỉnh sửa", plan.recruitmentPlanId)}
                    />
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="6" className="text-center">Không có dữ liệu</td>
        </tr>
    )}
              </tbody>
            </table>
          )}
        </div>

        {/* === Pagination === */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* --- 💎 RENDER MODALS --- */}
      
      // src/pages/RecruitmentPlanPage.jsx (Thay thế toàn bộ khối Modal 1)

{/* 1. Modal Xem chi tiết (Chờ duyệt) */}
{modalStep === 1 && selectedPlan && (
    <Modal 
      title="Chi tiết Kế hoạch tuyển dụng" 
      onClose={handleCloseModal}
      width={600}
    >
      {renderPlanDetails(selectedPlan, false)}

      {/* TERNARY EXPRESSION BAO GỒM 3 TRẠNG THÁI */}
      {selectedPlan.status === "PENDING" ? (
          // PENDING: HIỂN THỊ NÚT PHÊ DUYỆT/TỪ CHỐI
          <div className="modal-footer">
              <button className="modal-btn btn-reject" onClick={handleStartReject}>Từ chối</button>
              <button className="modal-btn btn-approve" onClick={handleApprove}>Phê duyệt</button>
          </div>
      ) : selectedPlan.status === "CANCELED" || selectedPlan.status === "REJECTED" ? ( 
          // CANCELED/REJECTED: HIỂN THỊ LÝ DO BỊ HỦY/TỪ CHỐI
          <div className="modal-footer-canceled">
              <p className="rejection-title">LÝ DO KẾ HOẠCH BỊ {selectedPlan.status === 'CANCELED' ? 'HỦY' : 'TỪ CHỐI'}:</p>
              <p className="rejection-reason-text">
                  {selectedPlan.note || "Không có lý do cụ thể được ghi lại."}
              </p>
              <button className="modal-btn btn-secondary" onClick={handleCloseModal}>
                  Đóng
              </button>
          </div>
      ) : (
          // TRẠNG THÁC KHÁC: CHỈ XEM
          <div className="modal-footer justify-content-center">
              <p style={{ margin: 0, color: '#6b7280', fontWeight: 600 }}>
                  Kế hoạch đang ở trạng thái "{selectedPlan.status}". Chỉ có thể xem.
              </p>
              <button className="modal-btn btn-secondary" onClick={handleCloseModal}>
                  Đóng
              </button>
          </div>
      )}
    </Modal>
)}
      {/* 2. Modal Đã duyệt */}
      {modalStep === 2 && selectedPlan && (
        <Modal 
          title="Kế hoạch Đã xác nhận" 
          onClose={handleCloseModal}
          width={600}
        >
          {renderPlanDetails(selectedPlan, true)}
          <div className="modal-footer">
            <button className="modal-btn btn-secondary" onClick={() => console.log("Xem kết quả đào tạo")}>
              Xem kết quả đào tạo
            </button>
            <button className="modal-btn btn-approve" onClick={() => console.log("Xem kết quả tuyển dụng")}>
              Xem kết quả tuyển dụng
            </button>
          </div>
        </Modal>
      )}

      {/* 3. Modal Từ chối */}
      {modalStep === 3 && selectedPlan && (
        <Modal 
          title="Lý do Từ chối Kế hoạch" 
          onClose={handleCloseModal}
          width={500}
        >
          <div className="reject-form">
            <label htmlFor="rejectReason">
              Vui lòng nhập lý do từ chối kế hoạch: "{selectedPlan.planName}"
            </label>
            <textarea
              id="rejectReason"
              className="reject-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do..."
            />
          </div>
          <div className="modal-footer">
            <button className="modal-btn btn-secondary" onClick={handleCloseModal}>
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
      {/* --- (Hết) RENDER MODALS --- */}
    </Layout>
  );
};

export default RecruitmentPlanPage;
