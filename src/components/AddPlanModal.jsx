// src/components/AddPlanModal.jsx
import React from "react";
import "../styles/plan.css";

export default function AddPlanModal({ open, onClose, form, onChange, onSubmit, techSummary }) {
    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...form, [name]: value });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content wide">
                <div className="modal-header">
                    <h3>Thêm kế hoạch tuyển dụng</h3>
                    <button className="btn-close-top" onClick={onClose} aria-label="Đóng">✖</button>
                </div>

                <div className="modal-body grid-2">
                    {form.requestId ? (
                        <div className="form-group">
                            <label>Request ID</label>
                            <input type="text" value={form.requestId} readOnly className="input-readonly" />
                        </div>
                    ) : null}

                    <div className="form-group">
                        <label>Tên kế hoạch</label>
                        <input
                            type="text"
                            name="planName"
                            value={form.planName || ""}
                            onChange={handleChange}
                            placeholder="Nhập tên kế hoạch"
                            className="filter-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select
                            name="status"
                            value={form.status || "DRAFT"}
                            onChange={handleChange}
                            className="filter-select"
                        >
                            <option value="DRAFT">Nháp</option>
                            <option value="IN_PROGRESS">Đang xử lý</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELED">Đã hủy</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Hạn tuyển dụng</label>
                        <input
                            type="date"
                            name="recruitmentDeadline"
                            value={form.recruitmentDeadline || ""}
                            onChange={handleChange}
                            className="filter-date"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Hạn bàn giao</label>
                        <input
                            type="date"
                            name="deliveryDeadline"
                            value={form.deliveryDeadline || ""}
                            onChange={handleChange}
                            className="filter-date"
                            required
                        />
                    </div>

                    <div className="form-group full">
                        <label>Ghi chú</label>
                        <textarea
                            name="note"
                            value={form.note || ""}
                            onChange={handleChange}
                            placeholder="Nhập ghi chú (nếu có)…"
                        />
                    </div>

                    {techSummary?.length ? (
                        <div className="form-group full">
                            <label>Công nghệ & số lượng </label>
                            <table className="info-table">
                                <thead>
                                <tr><th>Công nghệ</th><th>Số lượng</th></tr>
                                </thead>
                                <tbody>
                                {techSummary.map((t, i) => (
                                    <tr key={i}>
                                        <td>{t.technologyName}</td>
                                        <td>{t.soLuong}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>

                <div className="modal-actions">
                    <button className="btn-approve" onClick={onSubmit}>Tạo kế hoạch</button>
                    <button className="btn-close" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
}