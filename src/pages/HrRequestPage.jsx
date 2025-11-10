// src/pages/HRRequestPage.jsx
import { useState } from "react";
import useHrRequests from "../hooks/useHrRequests.jsx";
import Layout from "../components/Layout";
import CreateRequestModal from "../components/CreateRequestModal.jsx";
import { RefreshCw, Edit2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/request.css";

export default function HRRequestPage() {
  const { requests, loading, refetch } = useHrRequests();
  const [showModal, setShowModal] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // === PHÂN TRANG ===
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = requests.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
          <button onClick={refetch} className="btn-refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        <table className="table table-hr">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên nhu cầu</th>
              <th>Thời gian tạo</th>
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

        {/* === PHÂN TRANG === */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="pagination-info">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <CreateRequestModal
          isOpen={showModal}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            setCurrentPage(1); // Quay về trang 1 sau khi thêm/sửa
            alert(editRequest ? "Cập nhật thành công!" : "Tạo thành công!");
          }}
          initialData={editRequest}
        />
      </div>
    </Layout>
  );
}