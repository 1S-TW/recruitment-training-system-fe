import { useState } from "react";
import useHrRequests from "../hooks/useHrRequests";
import Layout from "../components/Layout";
import ActionButtons from "../components/ActionButtons";
import CreateRequestModal from "../components/CreateRequestModal";
import { RefreshCw } from "lucide-react";
import "../styles/request.css";

export default function HRRequestPage() {
  const { requests, loading, refetch } = useHrRequests();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <h2>Nhu cầu nhân sự</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-add-request"
          >
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
              requests.map((r, index) => (
                <tr key={r.requestId}>
                  <td>{index + 1}</td>
                  <td>{r.requestTitle}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td><span className={`status status-${r.status?.toLowerCase().replace('_', '-')}`}>{r.status}</span></td>
                  <td>{r.createdBy || "Không rõ"}</td>
                  <td>
                    <ActionButtons
                      onView={() => console.log("View")}
                      onEdit={() => console.log("Edit")}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <CreateRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
            alert("Yêu cầu nhân sự đã được gửi thành công!");
          }}
        />
      </div>
    </Layout>
  );
}