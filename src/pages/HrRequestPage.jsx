// src/pages/HRRequestPage.jsx
import { useState, useEffect } from "react";
import useHrRequests from "../hooks/useHrRequests.jsx";
import Layout from "../components/Layout";
import CreateRequestModal from "../components/CreateRequestModal.jsx";
import { RefreshCw, Edit2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../styles/request.css";

export default function HRRequestPage() {
  const { requests, loading, refetch } = useHrRequests();
  const [showModal, setShowModal] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(null); // null | "asc" | "desc"
  const [isSorting, setIsSorting] = useState(false);
  const itemsPerPage = 10;

  // Tải trạng thái sort từ localStorage khi component mount
  useEffect(() => {
    const savedSort = localStorage.getItem("hrRequestSortOrder");
    if (savedSort && ["asc", "desc"].includes(savedSort)) {
      setSortOrder(savedSort);
    }
  }, []);

  // Lưu trạng thái sort vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (sortOrder) {
      localStorage.setItem("hrRequestSortOrder", sortOrder);
    } else {
      localStorage.removeItem("hrRequestSortOrder");
    }
  }, [sortOrder]);

  const openCreate = () => {
    setEditRequest(null);
    setShowModal(true);
  };

  const openEdit = (request) => {
    if (request.status !== "DANG_CHO") return;
    setEditRequest({
      ...request,
      techQuantities: request.techQuantities || []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRequest(null);
  };

  // Hàm xử lý sắp xếp
  const handleSort = () => {
    setIsSorting(true);
    
    // Đổi trạng thái sort theo vòng: null → desc → asc → null
    setSortOrder(prev => {
      if (prev === null) return "desc";
      if (prev === "desc") return "asc";
      return null;
    });

    // Hiệu ứng loading 300ms
    setTimeout(() => {
      setIsSorting(false);
      // Scroll lên đầu bảng
      const tableElement = document.querySelector(".table-hr");
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  // Sắp xếp dữ liệu
  const getSortedRequests = () => {
    if (!sortOrder) return requests;
    
    const sorted = [...requests].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (sortOrder === "asc") {
        return dateA - dateB; // Cũ → Mới
      } else {
        return dateB - dateA; // Mới → Cũ
      }
    });
    
    return sorted;
  };

  // === PHÂN TRANG ===
  const sortedRequests = getSortedRequests();
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedRequests.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirst = () => setCurrentPage(1);
  const goToLast = () => setCurrentPage(totalPages);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <h2>Nhu cầu nhân sự</h2>
          <button onClick={openCreate} className="btn-add-request">
            Thêm nhu cầu
          </button>
        </div>

        <div className="page-header-actions">
          <button onClick={refetch} className="btn-refresh" title="Làm mới dữ liệu">
            <RefreshCw size={18} />
          </button>
        </div>

        <table className="table table-hr">
          <colgroup>
            <col style={{ width: '60px' }} />
            <col />
            <col style={{ width: '220px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '140px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên nhu cầu</th>
              <th className="th-time">
                <div className="th-sort-wrapper">
                  <span className="th-label">Thời gian tạo</span>
                  <button
                    onClick={handleSort}
                    className={`btn-sort ${isSorting ? "sorting" : ""} ${sortOrder ? "active" : ""}`}
                    title={
                      sortOrder === null
                        ? "Sắp xếp theo thời gian tạo"
                        : sortOrder === "asc"
                        ? "Đang sắp xếp tăng dần (cũ → mới)"
                        : "Đang sắp xếp giảm dần (mới → cũ)"
                    }
                    aria-label="Sắp xếp theo thời gian tạo"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`sort-icon ${sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : ""}`}
                    >
                      <path
                        d="M8 3L11 6H5L8 3Z"
                        fill="currentColor"
                        opacity={sortOrder === "desc" ? "0.3" : "1"}
                      />
                      <path
                        d="M8 13L5 10H11L8 13Z"
                        fill="currentColor"
                        opacity={sortOrder === "asc" ? "0.3" : "1"}
                      />
                    </svg>
                  </button>
                </div>
              </th>
              <th>Trạng thái</th>
              <th>Người gửi</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr><td colSpan="6" className="text-center">Không có dữ liệu</td></tr>
            ) : (
              currentData.map((r, index) => {
                const canEdit = r.status === "DANG_CHO";
                const globalIndex = startIndex + index + 1;

                return (
                  <tr key={r.requestId}>
                    <td>{globalIndex}</td>
                    <td>{r.requestTitle}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status status-${r.status?.toLowerCase().replace('_', '-')}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.createdByName || "Không rõ"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => console.log("View", r)}
                          className="btn-action btn-view"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={canEdit ? () => openEdit(r) : null}
                          className={`btn-action btn-edit ${!canEdit ? "disabled" : ""}`}
                          disabled={!canEdit}
                          title={canEdit ? "Chỉnh sửa" : "Không thể chỉnh sửa"}
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* === PHÂN TRANG 4 NÚT === */}
        {totalPages > 1 && (
          <div className="pagination">
            {/* VỀ TRANG ĐẦU */}
            <button
              onClick={goToFirst}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Về trang đầu"
            >
              <ChevronsLeft size={18} />
            </button>

            {/* LÙI 1 TRANG */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Lùi 1 trang"
            >
              <ChevronLeft size={18} />
            </button>

            {/* HIỆN TRẠNG THÁI */}
            <span className="pagination-info">
              Trang {currentPage} / {totalPages}
            </span>

            {/* TIẾN 1 TRANG */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Tiến 1 trang"
            >
              <ChevronRight size={18} />
            </button>

            {/* ĐẾN TRANG CUỐI */}
            <button
              onClick={goToLast}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Đến trang cuối"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        )}

        <CreateRequestModal
          isOpen={showModal}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            setCurrentPage(1);
            alert(editRequest ? "Cập nhật thành công!" : "Tạo thành công!");
          }}
          initialData={editRequest}
        />
      </div>
    </Layout>
  );
}