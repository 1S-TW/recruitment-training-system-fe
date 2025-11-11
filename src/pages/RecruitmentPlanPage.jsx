// src/pages/RecruitmentPlanPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
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

  const [openAddModal, setOpenAddModal] = useState(false);
  const [techSummary, setTechSummary] = useState([]);
  const [requestTitle, setRequestTitle] = useState("");
  const [modalMode, setModalMode] = useState("select"); // 'locked' | 'select'
  const [requestOptions, setRequestOptions] = useState([]);

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

  // mở modal từ phê duyệt (lock)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get("requestId");
    if (!requestId) return;

    (async () => {
      try {
        const res = await axiosAuth.get(`/api/hr-request/${requestId}/plan-defaults`);
        const d = res.data;
        setForm({
          requestId: d.requestId,
          planName: "",
          status: d.status || "DRAFT",
          recruitmentDeadline: d.recruitmentDeadline || "",
          deliveryDeadline: d.deliveryDeadline || "",
          note: d.note || "",
        });
        setRequestTitle(d.suggestedPlanName || d.requestTitle || "");
        setTechSummary(d.techQuantities || []);
        setModalMode("locked");
        setOpenAddModal(true);
      } catch {
        setModalMode("locked");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // lọc bảng
  useEffect(() => {
    let filtered = [...plans];
    if (searchName.trim()) {
      filtered = filtered.filter((p) =>
        (p.planName || "").toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
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
    setCurrentPage(p);
  };

  // mở modal chọn nhu cầu NEW
  const openEmptyAddModal = async () => {
    setForm({
      requestId: undefined,
      planName: "",
      status: "DRAFT",
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
      setForm((f) => ({ ...f, requestId: undefined, recruitmentDeadline: "", deliveryDeadline: "" }));
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
        status: d.status || "DRAFT",
        recruitmentDeadline: d.recruitmentDeadline || "",
        deliveryDeadline: d.deliveryDeadline || "",
        note: d.note || "",
      });
      setRequestTitle(d.suggestedPlanName || d.requestTitle || "");
      setTechSummary(d.techQuantities || []);
    } catch {
      setForm((f) => ({ ...f, requestId: undefined, recruitmentDeadline: "", deliveryDeadline: "" }));
      setTechSummary([]);
      setRequestTitle("");
    }
  };

  const submitPlan = async () => {
    try {
      if (!form.requestId) {
        alert("⚠️ Vui lòng chọn nhu cầu (NEW) trước khi tạo kế hoạch.");
        return;
      }
      if (!form.planName || !form.recruitmentDeadline || !form.deliveryDeadline) {
        alert("⚠️ Vui lòng nhập tên kế hoạch.");
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

      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

          <div className="filter-bar">
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

            <div className="filter-item">
              <DatePicker selectedDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} />
            </div>

            <div className="filter-item add-btn-wrapper">
              <button className="add-plan-btn modern-add" onClick={openEmptyAddModal}>
                ＋ Thêm kế hoạch tuyển dụng
              </button>
            </div>
          </div>
        </div>

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
                    <td colSpan="6" className="text-center">Không có dữ liệu</td>
                  </tr>
                ) : (
                  currentPlans.map((plan, index) => (
                    <tr key={plan.recruitmentPlanId || index}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{plan.planName}</td>
                      <td>{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}</td>
                      <td><span className="status-badge">{plan.status}</span></td>
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

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

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
    </Layout>
  );
};

export default RecruitmentPlanPage;
