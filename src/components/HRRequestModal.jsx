// src/components/HRRequestModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // dùng để redirect sau khi approve
import "../styles/HRRequestModal.css";

export default function HRRequestModal({ isOpen, onClose, request, onActionSuccess }) {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && request) {
            setNote(request.note || "");
        }
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    // Trạng thái nghiệp vụ
    const status = (request.status || "").toUpperCase();
    const isApproved = status === "APPROVED";
    const isCanceled = status === "CANCELED";

    // Đọc thông điệp lỗi từ server (ưu tiên JSON {message})
    const readErrorMessage = async (res) => {
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            return data?.message || text || "Có lỗi xảy ra.";
        } catch {
            return text || "Có lỗi xảy ra.";
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/approve?note=${encodeURIComponent(
                note
            )}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const msg = await readErrorMessage(res);
                if (res.status === 401) {
                    alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                } else if (res.status === 403) {
                    alert("⚠️ Bạn không có quyền phê duyệt yêu cầu này.");
                } else if (res.status === 409) {
                    // Ví dụ: "Yêu cầu đã bị từ chối, không thể phê duyệt" hoặc các xung đột khác
                    alert(`⚠️ Không thể phê duyệt: ${msg}`);
                } else if (res.status === 400) {
                    alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
                } else {
                    alert(`⚠️ Lỗi khi phê duyệt yêu cầu: ${msg}`);
                }
                return;
            }

            alert("✅ Yêu cầu đã được phê duyệt!");
            onActionSuccess?.(); // reload list nhu cầu (nếu có)
            onClose();

            // Redirect sang trang Plan để auto-open modal "Thêm Plan"
            navigate(`/recruitment/plan?requestId=${request.requestId}`);
        } catch (err) {
            alert(`⚠️ Lỗi mạng khi phê duyệt yêu cầu: ${err?.message || ""}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/reject?note=${encodeURIComponent(
                note
            )}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const msg = await readErrorMessage(res);
                if (res.status === 401) {
                    alert("⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                } else if (res.status === 403) {
                    alert("⚠️ Bạn không có quyền từ chối yêu cầu này.");
                } else if (res.status === 409) {
                    // Trường hợp điển hình: "Yêu cầu đã được phê duyệt, không thể từ chối"
                    alert(`⚠️ Không thể từ chối: ${msg}`);
                } else if (res.status === 400) {
                    alert(`⚠️ Dữ liệu không hợp lệ: ${msg}`);
                } else {
                    alert(`⚠️ Lỗi khi từ chối yêu cầu: ${msg}`);
                }
                return;
            }

            alert("❌ Yêu cầu đã bị từ chối!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            alert(`⚠️ Lỗi mạng khi từ chối yêu cầu: ${err?.message || ""}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* Header với nút X */}
                <div className="modal-header">
                    <h3>Chi tiết yêu cầu nhân sự</h3>
                    <button className="btn-close-top" onClick={onClose} aria-label="Đóng modal">
                        ✖
                    </button>
                </div>

                <div className="modal-body">
                    <p>
                        <strong>Tên nhu cầu:</strong> {request.requestTitle}
                    </p>
                    <p>
                        <strong>Người gửi:</strong> {request.createdByName}
                    </p>
                    <p>
                        <strong>Ngày tạo:</strong> {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <p>
                        <strong>Ngày bàn giao dự kiến:</strong>{" "}
                        {new Date(request.expectedDeliveryDate).toLocaleDateString()}
                    </p>
                    <p>
                        <strong>Tổng số lượng ứng viên:</strong> {request.quantityCandidate}
                    </p>
                    <p>
                        <strong>Trạng thái:</strong> {request.status}
                    </p>

                    {/* ✅ Hiển thị bảng chi tiết công nghệ và số lượng */}
                    <table className="info-table">
                        <thead>
                        <tr>
                            <th>Công nghệ</th>
                            <th>Số lượng</th>
                        </tr>
                        </thead>
                        <tbody>
                        {request.techQuantities?.map((item, index) => (
                            <tr key={index}>
                                <td>{item.technology}</td>
                                <td>{item.quantity}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <textarea
                        placeholder="Nhập ghi chú (tùy chọn)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />

                    {/* Hints theo trạng thái */}
                    {isApproved && (
                        <p className="hint-text" style={{ color: "#d89614", marginTop: 8 }}>
                            Yêu cầu đã được phê duyệt — thao tác “Từ chối” không khả dụng.
                        </p>
                    )}
                    {isCanceled && (
                        <p className="hint-text" style={{ color: "#d89614", marginTop: 8 }}>
                            Yêu cầu đã được từ chối — thao tác “Phê duyệt” không khả dụng.
                        </p>
                    )}
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-approve"
                        onClick={handleApprove}
                        disabled={loading || isCanceled} // ⛔ không cho approve khi đã CANCELED
                        title={isCanceled ? "Yêu cầu đã được từ chối — không thể phê duyệt." : undefined}
                    >
                        Phê duyệt và Khởi tạo
                    </button>

                    <button
                        className="btn-reject"
                        onClick={handleReject}
                        disabled={loading || isApproved} // ⛔ không cho reject khi đã APPROVED
                        title={isApproved ? "Yêu cầu đã được phê duyệt — không thể từ chối." : undefined}
                    >
                        Từ chối
                    </button>

                    <button className="btn-close" onClick={onClose} disabled={loading}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
