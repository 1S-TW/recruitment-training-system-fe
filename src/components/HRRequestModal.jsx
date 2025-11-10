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
            if (!res.ok) throw new Error(text);

            alert("✅ Yêu cầu đã được phê duyệt!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
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
            if (!res.ok) throw new Error(text);

            alert("❌ Yêu cầu đã bị từ chối!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            alert("⚠️ Lỗi khi từ chối yêu cầu");
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
                    <button
                        className="btn-close-top"
                        onClick={onClose}
                        aria-label="Đóng modal"
                    >
                        ✖
                    </button>
                </div>

                <div className="modal-body">
                    <p><strong>Tên nhu cầu:</strong> {request.requestTitle}</p>
                    <p><strong>Người gửi:</strong> {request.createdByName}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                    <p><strong>Ngày bàn giao dự kiến:</strong> {new Date(request.expectedDeliveryDate).toLocaleDateString()}</p>
                    <p><strong>Tổng số lượng ứng viên:</strong> {request.quantityCandidate}</p>

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
                </div>
            </div>
        </div>
    );
}