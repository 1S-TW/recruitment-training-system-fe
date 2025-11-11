import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButton";
import "../styles/plan.css";
import DatePicker from "../components/DatePicker";

const RecruitmentPlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // === Fetch data ===
  useEffect(() => {
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
        setPlans(res.data);
        setFilteredPlans(res.data);
        setError(null);
      })
      .catch(() => setError("❌ Không thể tải danh sách kế hoạch tuyển dụng"))
      .finally(() => setLoading(false));
  }, []);

 // === Lọc dữ liệu ===
useEffect(() => {
  let filtered = [...plans];

  // 🔍 Lọc theo tên
  if (searchName.trim()) {
    filtered = filtered.filter((p) =>
      p.planName?.toLowerCase().includes(searchName.toLowerCase())
    );
  }

  // ⚙️ Lọc theo trạng thái
  if (statusFilter) {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

if (selectedDate) {
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  filtered = filtered.filter((p) => {
    const created = new Date(p.createdAt);
    return (
      created.getMonth() === selectedMonth &&
      created.getFullYear() === selectedYear
    );
  });
}
  setFilteredPlans(filtered);
  setCurrentPage(1);
}, [searchName, statusFilter, selectedDate, plans]);


  // === Lưu gợi ý tìm kiếm ===
  useEffect(() => {
    if (searchName.trim()) {
      let recentNames = JSON.parse(localStorage.getItem("recentNames") || "[]");
      if (!recentNames.includes(searchName.trim())) {
        recentNames = [searchName.trim(), ...recentNames.slice(0, 9)];
        localStorage.setItem("recentNames", JSON.stringify(recentNames));
      }
    }
  }, [searchName]);

  // === Phân trang ===
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirst, indexOfLast);

 
// === Đổi số hiển thị ===
const handleChangeItemsPerPage = (e) => {
  const newValue = Number(e.target.value);
  setItemsPerPage(newValue);
  setCurrentPage(1);
};

 
// === Đổi trang ===
const handlePageChange = (page) => {
  if (page < 1 || page > totalPages) return;
  setCurrentPage(page);
};
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
              className="mini-pagination-select smooth-dropdown"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* === Content === */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

          {/* === Thanh lọc === */}
          <div className="filter-bar">
            {/* 🔍 Tìm theo tên có icon & gợi ý */}
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
               <span className="filter-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="5" />
    <line x1="11" y1="11" x2="15" y2="15" />
  </svg>
</span>

                <datalist id="recent-names">
                  {(JSON.parse(localStorage.getItem("recentNames") || "[]")).map(
                    (name, i) => (
                      <option key={i} value={name} />
                    )
                  )}
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
                <option value="PENDING">Đang chờ</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELED">Đã hủy</option>
              </select>
            </div>

            {/* 📅 Chọn ngày từ lịch */}
<div className="filter-item">
  <DatePicker
    selectedDate={selectedDate}
    onDateChange={(date) => setSelectedDate(date)}
  />
</div>
<div className="filter-item clear-filters-wrapper">
  <button
    className="clear-filters-btn modern-reset"
    onClick={(e) => {
      const btn = e.currentTarget.querySelector(".icon-refresh");
      btn.classList.add("spin-click");
      setTimeout(() => btn.classList.remove("spin-click"), 600);

      setSearchName("");
      setStatusFilter("");
      setSelectedDate(null); // hoặc setDateFilter("") nếu bạn chưa dùng selectedDate
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon-refresh"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    </svg>
    <span>Xóa tất cả bộ lọc</span>
  </button>
</div>

            {/* ➕ Nút thêm kế hoạch */}
            <div className="filter-item add-btn-wrapper">
              <button
                className="add-plan-btn modern-add"
                onClick={() => console.log("Thêm kế hoạch tuyển dụng")}
              >
                ＋ Thêm kế hoạch tuyển dụng
              </button>
            </div>
          </div>
        </div>
        {/* === Bảng === */}

       <div
 className="table-container">
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
                        {plan.createdAt
                          ? new Date(plan.createdAt).toLocaleDateString()
                          : "—"}
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
                          onView={() =>
                            console.log("Xem", plan.recruitmentPlanId)
                          }
                          onEdit={() =>
                            console.log("Chỉnh sửa", plan.recruitmentPlanId)
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* === Phân trang === */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </Layout>
  );
};

export default RecruitmentPlanPage;
