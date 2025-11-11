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
    const [techs, setTechs] = useState([{ technologyId: "", soLuong: 1 }]);
    const [technologies, setTechnologies] = useState([]);
    const [dateError, setDateError] = useState("");

    const { create, loading: createLoading } = useCreateRequest();
    const { update, loading: updateLoading } = useUpdateRequest();
    const loading = createLoading || updateLoading;

    const today = new Date();
    const minDate = new Date(today);
    minDate.setMonth(today.getMonth() + 2);
    const minDateStr = minDate.toISOString().split("T")[0];

    // ====== Khóa scroll nền & bắt phím Esc (UX nhỏ) ======
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

    // ====== NẠP DỮ LIỆU VÀO FORM KHI MỞ MODAL (GIỮ NGUYÊN GỐC) ======
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
                        soLuong: t.soLuong,
                    }))
                    : [{ technologyId: "", soLuong: 1 }]
            );
        } else if (!isEdit) {
            setTitle("");
            setNote("");
            const defaultDate = new Date(today);
            defaultDate.setMonth(today.getMonth() + 2);
            setExpectedDate(defaultDate.toISOString().split("T")[0]);
            setTechs([{ technologyId: "", soLuong: 1 }]);
        }
    }, [isOpen, isEdit, initialData]);

    // ====== LẤY DANH SÁCH CÔNG NGHỆ (gộp 1 effect duy nhất) ======
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
            setDateError("Vui lòng chọn ngày bàn giao tối thiểu sau 2 tháng kể từ hôm nay.");
        } else {
            setDateError("");
        }
    };

    // ====== Tech rows ======
    const addTech = () => setTechs((prev) => [...prev, { technologyId: "", soLuong: 1 }]);

    const updateTech = (i, field, value) => {
        setTechs((prev) => {
            const updated = [...prev];
            updated[i][field] = field === "soLuong" ? Math.max(1, Number(value)) : value;
            return updated;
        });
    };

    const removeTech = (i) => {
        setTechs((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
    };

    // ====== Submit (giữ luồng gốc, bổ sung emit event) ======
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (dateError || !title || techs.some((t) => !t.technologyId)) return;

        const data = {
            requestTitle: title,
            expectedDeliveryDate: expectedDate,
            note: note || null,
            techQuantities: techs
                .filter((t) => t.technologyId)
                .map((t) => ({
                    technologyId: parseInt(t.technologyId, 10),
                    soLuong: Number(t.soLuong) || 1,
                })),
        };

        let res;
        if (isEdit) {
            res = await update(initialData.requestId, data);
        } else {
            res = await create(data);
        }

        if (res?.success) {
            // phát sự kiện toàn cục để page refetch (bạn đã lắng nghe hr:requests:changed)
            try { window.dispatchEvent(new Event("hr:requests:changed")); } catch (_) {}
            onSuccess?.(res.message);
            onClose?.();
        } else if (res?.error) {
            alert(res.error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Click backdrop để đóng */}
            <div className="modal-backdrop" onClick={() => !loading && onClose?.()} />
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
                                <small className="section-desc">Chọn công nghệ và số lượng cần tuyển</small>
                            </div>

                            <div className="tech-list-custom">
                                {techs.map((tech, i) => (
                                    <TechRow
                                        key={i}
                                        tech={tech}
                                        index={i}
                                        onChange={updateTech}
                                        onRemove={removeTech}
                                        technologies={technologies}
                                        totalTechs={techs.length}
                                    />
                                ))}
                            </div>

                            <button type="button" onClick={addTech} className="btn-add-tech-custom">
                                <Plus size={18} /> Thêm công nghệ
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
                        <button type="button" onClick={onClose} className="btn btn-cancel" disabled={loading}>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !!dateError || !title || techs.some((t) => !t.technologyId)}
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
