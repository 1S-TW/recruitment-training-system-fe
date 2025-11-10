import React, { useState, useEffect } from "react";
import "../styles/HRRequestModal.css";

export default function HRRequestModal({ isOpen, onClose, request, onActionSuccess }) {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");

    useEffect(() => {
        if (isOpen && request) {
            setNote(request.note || "");
        }
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleApprove = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/approve?note=${encodeURIComponent(note)}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const text = await res.text();
            console.log("Phản hồi approve:", text);

            if (!res.ok) throw new Error(text);

            alert("✅ Yêu cầu đã được phê duyệt!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            console.error("Lỗi approve:", err);
            alert("⚠️ Lỗi khi phê duyệt yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/reject?note=${encodeURIComponent(note)}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const text = await res.text();
            console.log("Phản hồi reject:", text);

            if (!res.ok) throw new Error(text);

            alert("❌ Yêu cầu đã bị từ chối!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            console.error("Lỗi reject:", err);
            alert("⚠️ Lỗi khi từ chối yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Chi tiết yêu cầu nhân sự</h3>
                <div className="modal-body">
                    <p><strong>Tên nhu cầu:</strong> {request.requestTitle}</p>
                    <p><strong>Người gửi:</strong> {request.createdBy}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(request.createdAt).toLocaleString()}</p>

                    <table className="info-table">
                        <thead>
                        <tr>
                            <th>Tổng số lượng ứng viên</th>
                            <th>Công nghệ yêu cầu</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{request.quantityCandidate}</td>
                            <td>{Array.isArray(request.technologies) ? request.technologies.join(", ") : request.technologies}</td>
                        </tr>
                        </tbody>
                    </table>

                    <textarea
                        placeholder="Nhập ghi chú (tùy chọn)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-approve" onClick={handleApprove} disabled={loading}>
                        ✅ Phê duyệt
                    </button>
                    <button className="btn-reject" onClick={handleReject} disabled={loading}>
                        ❌ Từ chối
                    </button>
                    <button className="btn-close" onClick={onClose} disabled={loading}>
                        Đóng
                    </button>
                    <button className="btn-back" onClick={onClose} disabled={loading}>
                        🔙 Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}