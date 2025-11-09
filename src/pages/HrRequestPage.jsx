// src/pages/HRRequestPage.jsx
import { useState } from "react";
import useHrRequests from "../hooks/useHrRequests.jsx";
import Layout from "../components/Layout";
import CreateRequestModal from "../components/CreateRequestModal.jsx";
import { RefreshCw, Edit2, Eye } from "lucide-react";
import "../styles/request.css";

export default function HRRequestPage() {
  const { requests, loading, refetch } = useHrRequests();
  const [showModal, setShowModal] = useState(false);
  const [editRequest, setEditRequest] = useState(null);

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
            {requests.length === 0 ? (
              <tr><td colSpan="6" className="text-center">Không có dữ liệu</td></tr>
            ) : (
              requests.map((r, index) => {
                const canEdit = r.status === "DANG_CHO";

                return (
                  <tr key={r.requestId}>
                    <td>{index + 1}</td>
                    <td>{r.requestTitle}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status status-${r.status?.toLowerCase().replace('_', '-')}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.createdByName || "Không rõ"}</td>
                    <td>
                      {/* GỘP ACTIONBUTTONS – 2 NÚT NẰM NGANG */}
                      <div className="action-buttons">
                        {/* NÚT XEM */}
                        <button
                          onClick={() => console.log("View", r)}
                          className="btn-action btn-view"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>

                        {/* NÚT SỬA – CHỈ ĐỔI CURSOR KHI KHÔNG ĐƯỢC SỬA */}
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

        <CreateRequestModal
          isOpen={showModal}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            alert(editRequest ? "Cập nhật thành công!" : "Tạo thành công!");
          }}
          initialData={editRequest}
        />
      </div>
    </Layout>
  );
}