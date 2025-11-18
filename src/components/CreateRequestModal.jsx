import { useState, useEffect } from "react";
import { Plus, Send, X } from "lucide-react";
import TechRow from "./TechRow";
import useCreateRequest from "../hooks/useCreateRequest.jsx";
import useUpdateRequest from "../hooks/useUpdateRequest.jsx";
import axios from "axios";

export default function CreateRequestModal({ isOpen, onClose, onSuccess, initialData }) {
    // ====== Giữ NGUYÊN LOGIC GỐC ======
    const isEdit = !!initialData;

    const [title, setTitle] = useState("");
    const [expectedDate, setExpectedDate] = useState("");
    const [note, setNote] = useState("");
    // ✅ soLuong mặc định để TRỐNG
    const [techs, setTechs] = useState([{ technologyId: "", soLuong: "" }]);
    const [technologies, setTechnologies] = useState([]);
    const [dateError, setDateError] = useState("");

    const { create, loading: createLoading } = useCreateRequest();
    const { update, loading: updateLoading } = useUpdateRequest();
    const loading = createLoading || updateLoading;

    // === 2 THÁNG RƯỠI KỂ TỪ HÔM NAY ===
    const today = new Date();
    const minDate = new Date(today);
    minDate.setMonth(today.getMonth() + 2);
    minDate.setDate(minDate.getDate() + 15); // + nửa tháng
    const minDateStr = minDate.toISOString().split("T")[0];

    // ====== Khóa scroll nền & bắt phím Esc ======
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [isOpen, onClose]);

    // ====== NẠP DỮ LIỆU VÀO FORM KHI MỞ MODAL ======
    useEffect(() => {
        if (!isOpen) return;

        if (isEdit && initialData) {
            setTitle(initialData.requestTitle || "");
            setExpectedDate(initialData.expectedDeliveryDate || "");
            setNote(initialData.note || "");
            setTechs(
                initialData.techQuantities?.length > 0
                    ? initialData.techQuantities.map((t) => ({
                        technologyId: String(t.technologyId),
                        // khi sửa thì có sẵn số lượng
                        soLuong: t.soLuong?.toString() ?? "",
                    }))
                    : [{ technologyId: "", soLuong: "" }]
            );
        } else if (!isEdit) {
            setTitle("");
            setNote("");
            const defaultDate = new Date(today);
            defaultDate.setMonth(today.getMonth() + 2);
            defaultDate.setDate(defaultDate.getDate() + 15); // 2.5 tháng
            setExpectedDate(defaultDate.toISOString().split("T")[0]);
            // ✅ hàng công nghệ đầu tiên: số lượng rỗng
            setTechs([{ technologyId: "", soLuong: "" }]);
        }
    }, [isOpen, isEdit, initialData]);

    // ====== LẤY DANH SÁCH CÔNG NGHỆ ======
    useEffect(() => {
        if (!isOpen) return;
        const token = localStorage.getItem("token");
        axios
            .get("http://localhost:8080/api/hr-request/technologies", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setTechnologies(res.data || []))
            .catch(() => setTechnologies([]));
    }, [isOpen]);

    // ====== Validate ngày ======
    const handleDateChange = (value) => {
        setExpectedDate(value);
        const selected = new Date(value);
        if (selected < minDate) {
            setDateError("Vui lòng chọn ngày bàn giao tối thiểu sau 2 tháng rưỡi kể từ hôm nay.");
        } else {
            setDateError("");
        }
    };

    // ====== Tech rows ======
    const addTech = () =>
        setTechs((prev) => [...prev, { technologyId: "", soLuong: "" }]); // ✅ thêm hàng mới với soLuong trống

    // ✅ cho phép xoá hết số rồi gõ lại; không auto set 1 nữa
    const updateTech = (i, field, value) => {
        setTechs((prev) => {
            const updated = [...prev];

            if (field === "soLuong") {
                if (value === "") {
                    updated[i].soLuong = "";
                } else {
                    const num = Number(value);
                    updated[i].soLuong = Number.isNaN(num) || num <= 0 ? "" : value;
                }
            } else {
                updated[i][field] = value;
            }

            return updated;
        });
    };

    const removeTech = (i) => {
        setTechs((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
    };

    // ✅ TÍNH LIST CÔNG NGHỆ CÒN TRỐNG CHO MỖI DÒNG
    const getAvailableTechnologies = (rowIndex) => {
        if (!Array.isArray(technologies) || technologies.length === 0) return [];

        // id các công nghệ đã dùng ở các dòng KHÁC
        const usedIds = new Set(
            techs
                .map((t, idx) => (idx === rowIndex ? null : t.technologyId))
                .filter(Boolean)
                .map(String)
        );

        const filtered = technologies.filter((t) => {
            const id = String(t.id ?? t.technologyId);
            return !usedIds.has(id);
        });

        // Nếu lọc xong trống (vd số công nghệ < số dòng) thì cho hiện full (cho phép trùng)
        if (filtered.length === 0) return technologies;

        return filtered;
    };

    // helper: check điều kiện hợp lệ cho techs
    const hasInvalidTech = techs.some(
        (t) =>
            !t.technologyId || // chưa chọn công nghệ
            !t.soLuong ||      // chưa nhập số lượng
            Number(t.soLuong) <= 0
    );

    // ====== Submit (giữ luồng gốc) ======
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (dateError || !title || hasInvalidTech) return;

        const data = {
            requestTitle: title,
            expectedDeliveryDate: expectedDate,
            note: note || null,
            techQuantities: techs
                .filter((t) => t.technologyId && t.soLuong)
                .map((t) => ({
                    technologyId: parseInt(t.technologyId, 10),
                    soLuong: Number(t.soLuong), // đã chắc chắn > 0
                })),
        };

        let res;
        if (isEdit) {
            res = await update(initialData.requestId, data);
        } else {
            res = await create(data);
        }

        if (res?.success) {
            try {
                window.dispatchEvent(new Event("hr:requests:changed"));
            } catch (_) {}
            onClose?.();
        } else if (res?.error) {
            alert(res.error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Click backdrop để đóng */}
            <div className="modal-backdrop" onClick={() => !loading } />
            <div className="modal create-modal" role="dialog" aria-modal="true">
                {/* HEADER */}
                <div className="modal-header-custom">
                    <div className="header-title-group">
                        <h3>{isEdit ? "Chỉnh sửa nhu cầu" : "Tạo nhu cầu nhân sự"}</h3>
                    </div>
                    <button
                        onClick={() => !loading && onClose?.()}
                        className="btn-close-large"
                        aria-label="Đóng modal"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        {/* Tiêu đề */}
                        <div className="form-group full-width">
                            <label htmlFor="title">
                                Tên nhu cầu <span className="required">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                maxLength="60"
                                placeholder="VD: Tuyển lập trình viên Java Backend"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <small className="help-text">{title.length}/60</small>
                        </div>

                        {/* Công nghệ */}
                        <div className="form-group full-width tech-section">
                            <div className="section-header">
                                <label>
                                    Công nghệ <span className="required">*</span>
                                </label>
                            </div>

                            <div className="tech-list-custom">
                                {techs.map((tech, i) => (
                                    <TechRow
                                        key={i}
                                        tech={tech}
                                        index={i}
                                        onChange={updateTech}
                                        onRemove={removeTech}
                                        technologies={getAvailableTechnologies(i)}
                                        totalTechs={techs.length}
                                    />
                                ))}
                            </div>

                            {/* ✅ Nút nhỏ lại, kiểu chữ như mẫu ảnh 2 */}
                            <button type="button" onClick={addTech} className="btn-add-tech-custom">
                                <Plus size={14} /> Thêm công nghệ
                            </button>
                        </div>

                        {/* Deadline */}
                        <div className="form-group">
                            <label htmlFor="deadline">
                                Thời hạn bàn giao <span className="required">*</span>
                            </label>
                            <div className="input-wrapper-date">
                                <input
                                    id="deadline"
                                    type="date"
                                    min={minDateStr}
                                    value={expectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    required
                                    className={dateError ? "error" : ""}
                                />
                            </div>
                            {dateError && <small className="error-text">{dateError}</small>}
                        </div>

                        {/* Ghi chú */}
                        <div className="form-group full-width">
                            <label htmlFor="note">Ghi chú (tùy chọn)</label>
                            <textarea
                                id="note"
                                rows="4"
                                maxLength="255"
                                placeholder="Ghi chú bổ sung..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-cancel"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !!dateError ||
                                !title ||
                                hasInvalidTech       // ✅ bắt buộc nhập số lượng > 0
                            }
                            className="btn btn-submit"
                            aria-busy={loading ? "true" : "false"}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" /> Đang xử lý...
                                </>
                            ) : (
                                <>
                                    {isEdit ? "Cập nhật" : "Gửi"} <Send size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
