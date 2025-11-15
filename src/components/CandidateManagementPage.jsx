// src/pages/CandidateManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, Pencil } from "lucide-react";
import "../styles/CandidateManagementPage.css";


export default function CandidateManagementPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // giống hình: hiển thị 10 dòng

  // TODO: đổi endpoint cho đúng với BE của bạn
  const API_URL = "http://localhost:8080/api/candidates";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(API_URL, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        // mong đợi res.data là array ứng viên
        setCandidates(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Lỗi tải danh sách ứng viên:", e);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lấy list kế hoạch tuyển dụng từ dữ liệu (unique)
  const planOptions = useMemo(() => {
    const set = new Set();
    candidates.forEach((c) => {
      if (c.recruitmentPlanName) set.add(c.recruitmentPlanName);
    });
    return Array.from(set);
  }, [candidates]);

  // Filter theo search + status + kế hoạch
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const keyword = searchTerm.trim().toLowerCase();

      if (keyword) {
        const inName = (c.fullName || c.name || "").toLowerCase().includes(keyword);
        const inEmail = (c.email || "").toLowerCase().includes(keyword);
        const inPhone = (c.phone || c.phoneNumber || "").toLowerCase().includes(keyword);
        if (!inName && !inEmail && !inPhone) return false;
      }

      if (statusFilter !== "ALL") {
        if ((c.status || "").toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (planFilter !== "ALL") {
        if ((c.recruitmentPlanName || "") !== planFilter) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, statusFilter, planFilter]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginated = filteredCandidates.slice(startIndex, startIndex + pageSize);

  const handleChangePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Action nút xem / sửa – tạm thời log ra console
  const handleView = (candidate) => {
    console.log("Xem ứng viên:", candidate);
    // TODO: mở modal xem chi tiết nếu muốn
  };

  const handleEdit = (candidate) => {
    console.log("Sửa ứng viên:", candidate);
    // TODO: mở modal sửa ứng viên nếu muốn
  };

  // Helper render pagination số trang giống list cũ
  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5; // số nút hiển thị

    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let p = start; p <= end; p++) {
      pages.push(
        <button
          key={p}
          className={`btn-page-number ${p === safePage ? "active-page" : ""}`}
          onClick={() => handleChangePage(p)}
        >
          {p}
        </button>
      );
    }

    return (
      <>
        {start > 1 && (
          <>
            <button className="btn-page-number" onClick={() => handleChangePage(1)}>
              1
            </button>
            {start > 2 && <span className="dots">...</span>}
          </>
        )}
        {pages}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="dots">...</span>}
            <button className="btn-page-number" onClick={() => handleChangePage(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <div className="request-page">
      {/* BREADCRUMB */}
      <div className="breadcrumb-container">
        <div className="breadcrumb-left">
          <span>Tuyển dụng</span>
          <span>&gt;</span>
          <span className="breadcrumb-current">Quản lý ứng viên</span>
        </div>
      </div>

      {/* TIÊU ĐỀ + FILTER BAR */}
      <div className="title-row">
        <h1 className="page-title-small">Quản lý ứng viên</h1>

        <div className="filter-bar">
          {/* 1) Ô search */}
          <div className="filter-item">
            <input
              className="filter-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span className="filter-icon-search">🔍</span>
          </div>

          {/* 2) Trạng thái */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Trạng thái...</option>
              <option value="Chưa có kết quả">Chưa có kết quả</option>
              <option value="Đã có kết quả">Đã có kết quả</option>
              <option value="Không nhận việc">Không nhận việc</option>
              <option value="Đã gửi email cảm ơn">Đã gửi email cảm ơn</option>
              <option value="Đã nhận việc">Đã nhận việc</option>
              <option value="Đã thông báo thời gian TT">Đã thông báo thời gian TT</option>
            </select>
          </div>

          {/* 3) Kế hoạch tuyển dụng */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Kế hoạch tuyển dụng...</option>
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          {/* BÊN PHẢI: link + nút Thêm ứng viên */}
          <div className="filter-item filter-right-group">
            <button
              type="button"
              className="link-process"
              onClick={() => {
                // TODO: mở modal / navigate trang hướng dẫn quy trình
                console.log("Xem quy trình tuyển dụng");
              }}
            >
              Quy trình tuyển dụng ?
            </button>

            <button
              type="button"
              className="btn-add-candidate"
              onClick={() => {
                // TODO: mở modal thêm ứng viên
                console.log("Thêm ứng viên");
              }}
            >
              + Thêm ứng viên
            </button>
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="table-container fade-in">
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
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                  Không có ứng viên phù hợp.
                </td>
              </tr>
            ) : (
              paginated.map((c, index) => {
                const stt = startIndex + index + 1;
                const name = c.fullName || c.name || "—";
                const email = c.email || "—";
                const phone = c.phone || c.phoneNumber || "—";
                const testScore = c.testScore ?? c.testPercent ?? "—";
                const interviewScore = c.interviewScore ?? c.interviewPoint ?? "—";
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
                    <td>
                      <div className="btn-group">
                        <div className="btn-action-wrapper">
                          <button
                            type="button"
                            className="btn-action btn-view"
                            onClick={() => handleView(c)}
                          >
                            <Eye size={16} />
                          </button>
                          <span className="action-tooltip">Xem chi tiết</span>
                        </div>

                        <div className="btn-action-wrapper">
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil size={16} />
                          </button>
                          <span className="action-tooltip">Chỉnh sửa</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="clean-pagination">
        <button
          className="nav-btn"
          onClick={() => handleChangePage(safePage - 1)}
          disabled={safePage <= 1}
        >
          {"<"}
        </button>

        <div className="page-numbers">{renderPageNumbers()}</div>

        <button
          className="nav-btn"
          onClick={() => handleChangePage(safePage + 1)}
          disabled={safePage >= totalPages}
        >
          {">"}
        </button>
      </div>
    </div>
  );
}
