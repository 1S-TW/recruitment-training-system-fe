import React, { useState } from "react";
import useHrRequests from "../hooks/useHrRequests";
import Layout from "../components/Layout";
import ActionButtons from "../components/ActionButtons";
import Pagination from "../components/Pagination";
import { UserCheck } from "lucide-react";
import "../styles/request.css";

export default function HRRequestPage() {
  const { requests, loading, error } = useHrRequests();

  // --- State phân trang & filter ---
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // --- Filter dữ liệu theo tên, trạng thái, ngày ---
  const filteredRequests = requests.filter((req) => {
    const matchesName = req.requestTitle
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    const matchesDate = dateFilter
      ? new Date(req.createdAt).toISOString().split("T")[0] === dateFilter
      : true;
    return matchesName && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirst, indexOfLast);

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

  return (
    <Layout>
      {/* === Breadcrumb === */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <div className="breadcrumb-icon-wrapper">
            <UserCheck size={18} strokeWidth={2} />
          </div>
          <span className="breadcrumb-item">Tuyển dụng</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Nhu cầu nhân sự</span>
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

      {/* === CONTENT === */}
      <div className="recruitment-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Nhu cầu nhân sự </h2>

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
              className="icon-refresh"
            >
              <path
                d="M21 12a9 9 0 1 1-3-6.7M21 8v4h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
                <span>Xóa tất cả bộ lọc</span>
              </button>
            </div>


            {/* ➕ Nút thêm kế hoạch */}
            <div className="filter-item add-btn-wrapper">
              <button
                className="add-plan-btn modern-add"
                onClick={() => console.log("Thêm nhu cầu nhân sự")}
              >
                ＋ Thêm nhu cầu nhân sự
              </button>
            </div>
          </div>
        </div>

        <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
          {loading && <p className="loading-text">Đang tải dữ liệu...</p>}

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                currentRequests.map((req, index) => (
                  <tr key={req.requestId || index}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{req.requestTitle}</td>
                    <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}</td>
                    <td><span className="status-badge">{{
                      NEW: "Đang chờ",
                      IN_PROGRESS: "Đang xử lý",
                      COMPLETED: "Hoàn thành",
                      CANCELED: "Đã hủy"
                    }[req.status] || "Không rõ"}
                    </span></td>
                    <td>{req.createdByName || "Không rõ"}</td>
                    <td className="actions-cell text-center">
                      <ActionButtons
                        onView={() => console.log("Xem", req.requestId)}
                        onEdit={() => console.log("Chỉnh sửa", req.requestId)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* === Pagination === */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </Layout>
  );
}
