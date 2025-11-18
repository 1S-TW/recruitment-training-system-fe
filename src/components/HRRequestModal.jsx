// src/components/HRRequestModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HRRequestModal.css";
import Modal from "./Modal"; // dùng lại Modal giống bên kế hoạch

export default function HRRequestModal({
  isOpen,
  onClose,
  request,
  onActionSuccess,
  onActionError,
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [techDict, setTechDict] = useState({});

  // Bước 2: modal lý do từ chối
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const navigate = useNavigate();

  // tải danh mục công nghệ để map id -> name
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/api/hr-request/technologies", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((list) => {
        const dict = {};
        (list || []).forEach((t) => (dict[t.id] = t.name));
        setTechDict(dict);
      })
      .catch(() => setTechDict({}));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && request) {
      setNote(request.note || "");
      setShowRejectModal(false); // mỗi lần mở lại thì quay về bước "chi tiết"
      setRejectReason("");
    }
  }, [isOpen, request]);

  const techRows = useMemo(() => {
    const arr = request?.techQuantities || [];
    return arr.map((t) => ({
      name: techDict[t.technologyId] || `#${t.technologyId}`,
      quantity: t.soLuong,
    }));
  }, [request?.techQuantities, techDict]);

  // Map mã trạng thái -> label tiếng Việt
  const getStatusLabel = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "NEW":
        return "Đã gửi";
      case "PENDING":
        return "Đang chờ";
      case "IN_PROGRESS":
        return "Đang tiến hành";
      case "COMPLETED":
        return "Đã hoàn thành";
      case "CANCELED":
        return "Đã hủy";
      default:
        return status || "Không rõ";
    }
  };

  const statusRaw = (request?.status || "").toUpperCase();
  const statusLabel = getStatusLabel(request?.status);

  const status = statusRaw;
  const isNew = status === "NEW";
  const isApproved = status === "APPROVED";
  const isCanceled = status === "CANCELED";

  const readErrorMessage = async (res) => {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data?.message || text || "Có lỗi xảy ra.";
    } catch {
      return text || "Có lỗi xảy ra.";
    }
  };

  // =============== PHÊ DUYỆT =================
  const handleApprove = async () => {
    if (!request || !isNew) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8080/api/hr-request/${
        request.requestId
      }/approve?note=${encodeURIComponent(note || "")}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        if (res.status === 401)
          alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        else if (res.status === 403)
          alert("⚠️ Bạn không có quyền phê duyệt yêu cầu này.");
        else if (res.status === 409) alert(`⚠️ Không thể phê duyệt: ${msg}`);
        else if (res.status === 400)
          alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
        else alert(`⚠️ Lỗi khi phê duyệt yêu cầu: ${msg}`);
        onActionError?.(msg);
        return;
      }

      onActionSuccess?.();
      onClose();
      navigate(`/recruitment/plan?requestId=${request.requestId}`);
    } catch (err) {
      const msg = err?.message || "";
      alert(`⚠️ Lỗi mạng khi phê duyệt yêu cầu: ${msg}`);
      onActionError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // =============== BẮT ĐẦU TỪ CHỐI (mở bước 2) =================
  const handleStartReject = () => {
    if (!request || !isNew) return;
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =============== GỬI LÝ DO TỪ CHỐI =================
  const handleSubmitReject = async () => {
    if (!request || !isNew) return;
    if (!rejectReason.trim()) {
      alert("Lý do từ chối không được để trống.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/api/hr-request/${request.requestId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason: rejectReason.trim(), // map đúng với DTO BE
          }),
        }
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        if (res.status === 401)
          alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        else if (res.status === 403)
          alert("⚠️ Bạn không có quyền từ chối yêu cầu này.");
        else if (res.status === 409) alert(`⚠️ Không thể từ chối: ${msg}`);
        else if (res.status === 400) alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
        else alert(`⚠️ Lỗi khi từ chối yêu cầu: ${msg}`);
        onActionError?.(msg);
        return;
      }

      onActionSuccess?.();
      setShowRejectModal(false); // đóng popup lý do
      onClose(); // đóng luôn modal Chi tiết
    } catch (err) {
      const msg = err?.message || "";
      alert(`⚠️ Lỗi mạng khi từ chối yêu cầu: ${msg}`);
      onActionError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const disableActions = loading || !isNew;

  return (
    <>
      {/* ====== BƯỚC 1: CHI TIẾT YÊU CẦU NHÂN SỰ ====== */}
      {!showRejectModal && (
        <div className="hrmodal-overlay">
          <div className="hrmodal-card">
            {/* Header */}
            <div className="hrmodal-header">
              <div>
                <h3 className="hrmodal-title">Chi tiết yêu cầu nhân sự</h3>
                <span
                  className={`status-pill status-${statusRaw.toLowerCase()}`}
                >
                  {statusLabel}
                </span>
              </div>
              <button
                className="hrmodal-close"
                onClick={onClose}
                aria-label="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="hrmodal-body">
              {/* khối thông tin chung */}
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Tên nhu cầu</span>
                  <span className="info-value">{request.requestTitle}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Người gửi</span>
                  <span className="info-value">{request.createdByName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ngày tạo</span>
                  <span className="info-value">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ngày bàn giao dự kiến</span>
                  <span className="info-value">
                    {new Date(
                      request.expectedDeliveryDate
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tổng số lượng ứng viên</span>
                  <span className="info-value strong">
                    {techRows.reduce((s, r) => s + (r.quantity || 0), 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trạng thái</span>
                  <span className="info-value">{statusLabel}</span>
                </div>
              </div>

              {/* bảng công nghệ */}
              <div className="section-block">
                <div className="section-header">
                  <h4>Công nghệ &amp; số lượng</h4>
                </div>
                <table className="hr-info-table">
                  <thead>
                    <tr>
                      <th>Công nghệ</th>
                      <th style={{ width: 120 }}>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techRows.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="table-empty">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      techRows.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.name}</td>
                          <td className="text-center">{row.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* nếu đã bị từ chối thì hiển thị LÝ DO TỪ CHỐI (đọc từ BE) */}
              {isCanceled && request.rejectReason && (
                <div className="section-block">
                  <div className="section-header">
                    <h4>Lý do từ chối</h4>
                  </div>
                  <div className="info-value">{request.rejectReason}</div>
                </div>
              )}

              {/* ghi chú chung */}
              <div className="section-block">
                <div className="section-header">
                  <h4>Ghi chú</h4>
                  <span className="section-sub">(tùy chọn)</span>
                </div>
                <textarea
                  className="note-input"
                  placeholder="Nhập ghi chú cho quyết định phê duyệt / từ chối..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!isNew} // tránh sửa ghi chú khi đã xử lý
                />
              </div>

              {(isApproved || isCanceled) && (
                <p className="hint-text">
                  {isApproved &&
                    "Yêu cầu đã được phê duyệt — thao tác “Từ chối / Phê duyệt” không khả dụng."}
                  {isCanceled &&
                    "Yêu cầu đã bị từ chối — thao tác “Từ chối / Phê duyệt” không khả dụng."}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="hrmodal-footer">
              <div className="footer-left" />
              <div className="footer-actions">
                <button
                  className={`btn-reject-main ${
                    disableActions ? "btn-disabled" : ""
                  }`}
                  onClick={handleStartReject}
                  disabled={disableActions}
                  title={
                    !isNew
                      ? "Chỉ trạng thái ĐÃ GỬI (NEW) mới được thao tác"
                      : undefined
                  }
                >
                  Từ chối
                </button>

                <button
                  className={`btn-approve-main ${
                    disableActions ? "btn-disabled" : ""
                  }`}
                  onClick={handleApprove}
                  disabled={disableActions}
                  title={
                    !isNew
                      ? "Chỉ trạng thái ĐÃ GỬI (NEW) mới được thao tác"
                      : undefined
                  }
                >
                  Phê duyệt và Khởi tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== BƯỚC 2: MODAL LÝ DO TỪ CHỐI (y hệt bên kế hoạch) ====== */}
      {showRejectModal && (
        <Modal
          title="Lý do Từ chối Nhu cầu"
          onClose={() => setShowRejectModal(false)}
          width={520}
        >
          <div className="reject-form">
            <label htmlFor="rejectReason" className="reject-label">
              Vui lòng nhập lý do từ chối nhu cầu:{" "}
              <span className="reject-plan-name">
                "{request.requestTitle}"
              </span>
            </label>
            <textarea
              id="rejectReason"
              className="reject-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do cụ thể, rõ ràng để người lập nhu cầu dễ dàng điều chỉnh..."
            />
          </div>
          <div className="modal-footer modal-footer-actions">
            <button
              className="modal-btn btn-secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Hủy
            </button>
            <button
              className="modal-btn btn-reject"
              onClick={handleSubmitReject}
              disabled={!rejectReason.trim() || loading}
            >
              Xác nhận từ chối
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
  