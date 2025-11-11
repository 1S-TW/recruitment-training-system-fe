// src/pages/RecruitmentPlanPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx"; // ✅ SỬA: đúng tên file
import AddPlanModal from "../components/AddPlanModal";
import DatePicker from "../components/DatePicker";
import "../styles/plan.css";

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

  // Modal & form
  const [openAddModal, setOpenAddModal] = useState(false);
  const [techSummary, setTechSummary] = useState([]);
  const [requestTitle, setRequestTitle] = useState("");
  const [form, setForm] = useState({
    requestId: undefined,
    planName: "",
    status: "DRAFT",
    recruitmentDeadline: "",
    deliveryDeadline: "",
    note: "",
  });

  const location = useLocation();
  const token = localStorage.getItem("token");

  const axiosAuth = axios.create({
    baseURL: "http://localhost:8080",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load danh sách kế hoạch
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nếu có requestId trên URL => mở modal tạo kế hoạch với defaults
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get("requestId");

    if (requestId) {
      (async () => {
        try {
          const res = await axiosAuth.get(`/api/hr-request/${requestId}/plan-defaults`);
          const d = res.data;
          setForm({
            requestId: d.requestId,
            planName: d.suggestedPlanName ? `Plan for ${d.suggestedPlanName}` : "",
            status: d.status || "DRAFT",
            recruitmentDeadline: d.recruitmentDeadline || "",
            deliveryDeadline: d.deliveryDeadline || "",
            note: d.note || "",
          });
          setRequestTitle(d.suggestedPlanName || "");
          setTechSummary(d.techQuantities || []);
          setOpenAddModal(true);
        } catch {
          // fallback vẫn mở modal nhưng trống
          setForm((f) => ({ ...f, requestId }));
          setRequestTitle("");
          setTechSummary([]);
          setOpenAddModal(true);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Lọc dữ liệu theo tên, trạng thái, tháng/năm
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
    if (selectedDate) {
      const m = selectedDate.getMonth();
      const y = selectedDate.getFullYear();
      filtered = filtered.filter((p) => {
        const created = new Date(p.createdAt);
        return created.getMonth() === m && created.getFullYear() === y;
      });
    }
    setFilteredPlans(filtered);
    setCurrentPage(1);
  }, [searchName, statusFilter, selectedDate, plans]);

  // Phân trang
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
    setCurrentPage(page);
  };

  // Mở modal thêm rỗng
  const openEmptyAddModal = () => {
    setTechSummary([]);
    setRequestTitle("");
    setForm({
      requestId: undefined,
      planName: "",
      status: "DRAFT",
      recruitmentDeadline: "",
      deliveryDeadline: "",
      note: "",
    });
    setOpenAddModal(true);
  };

  // Submit tạo kế hoạch
  const submitPlan = async () => {
    try {
      if (!form.planName || !form.recruitmentDeadline || !form.deliveryDeadline) {
        alert("⚠️ Vui lòng điền đầy đủ thông tin");
        return;
      }
      await axiosAuth.post("/api/recruitment-plans", form);
      setOpenAddModal(false);
      await loadPlans();
      alert("✅ Tạo kế hoạch thành công!");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Lỗi không xác định";
      alert(`⚠️ Không thể tạo kế hoạch: ${msg}`);
    }
  };

  return (
    <Layout>
      {/* ==== Breadcrumb + lựa chọn số bản ghi ==== */}
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
              className="mini-pagination-select smooth-dropdown"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==== Thanh bộ lọc ==== */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

          <div className="filter-bar">
            {/* 🔍 Tìm theo tên */}
            <div className="filter-item search-wrapper">
              <div className="search-input-container">
                <input
                  type="text"
                  className="filter-input search-input"
                  placeholder="Tìm theo tên..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  list="recent-names"
                />
                <span className="filter-icon">🔍</span>
                <datalist id="recent-names">
                  {(JSON.parse(localStorage.getItem("recentNames") || "[]")).map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* ⚙️ Trạng thái */}
            <div className="filter-item">
              <select
                className="filter-select smooth-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="PENDING">Đang chờ</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELED">Đã hủy</option>
              </select>
            </div>

            {/* 📅 Chọn tháng/năm */}
            <div className="filter-item">
              <DatePicker selectedDate={selectedDate} onDateChange={(date) => setSelectedDate(date)} />
            </div>

            {/* ➕ Nút thêm kế hoạch */}
            <div className="filter-item add-btn-wrapper">
              <button className="add-plan-btn modern-add" onClick={openEmptyAddModal}>
                ＋ Thêm kế hoạch tuyển dụng
              </button>
            </div>
          </div>
        </div>

        {/* 🧹 Xóa bộ lọc */}
        <div className="filter-item">
          <button
            className="clear-all-btn smooth-dropdown"
            onClick={() => {
              setSearchName("");
              setStatusFilter("");
              setSelectedDate(null);
            }}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        {/* ==== Bảng danh sách ==== */}
        <div className="table-container">
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
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}
                      </td>
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
                          onView={() => console.log("Xem", plan.recruitmentPlanId)}
                          onEdit={() => console.log("Chỉnh sửa", plan.recruitmentPlanId)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {/* ==== Modal thêm kế hoạch ==== */}
      <AddPlanModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        form={form}
        onChange={setForm}
        onSubmit={submitPlan}
        techSummary={techSummary}
        requestTitle={requestTitle}
      />
    </Layout>
  );
};

export default RecruitmentPlanPage;
