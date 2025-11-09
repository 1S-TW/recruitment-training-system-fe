import React, { useState } from "react";
import "../styles/HRRequestModal.css";

export default function HRRequestModal({ isOpen, onClose, request, onActionSuccess }) {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");

    if (!isOpen || !request) return null;

    const handleApprove = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token"); // 💡 lấy token JWT
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/approve?note=${encodeURIComponent(note || "")}`;
            console.log("✅ Gọi API phê duyệt:", url);

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`, // 💥 gửi token
                    "Content-Type": "application/json"
                }
            });

            const text = await res.text();
            console.log("Phản hồi:", text);

            if (!res.ok) throw new Error(text);

            alert("✅ Đã phê duyệt yêu cầu!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            console.error("Lỗi khi phê duyệt:", err);
            alert("⚠️ Lỗi khi phê duyệt");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token"); // 💡 lấy token JWT
            const url = `http://localhost:8080/api/hr-request/${request.requestId}/reject?note=${encodeURIComponent(note || "")}`;
            console.log("❌ Gọi API từ chối:", url);

            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`, // 💥 gửi token
                    "Content-Type": "application/json"
                }
            });

            const text = await res.text();
            console.log("Phản hồi:", text);

            if (!res.ok) throw new Error(text);

            alert("❌ Đã từ chối yêu cầu!");
            onActionSuccess?.();
            onClose();
        } catch (err) {
            console.error("Lỗi khi từ chối:", err);
            alert("⚠️ Lỗi khi từ chối");
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
                    <p><strong>Trạng thái:</strong> {request.status}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(request.createdAt).toLocaleString()}</p>

                    <textarea
                        placeholder="Nhập ghi chú (tùy chọn)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-approve" onClick={handleApprove} disabled={loading}>
                        ✅ Phê duyệt và Khởi tạo
                    </button>
                    <button className="btn-reject" onClick={handleReject} disabled={loading}>
                        ❌ Từ chối
                    </button>
                    <button className="btn-close" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
