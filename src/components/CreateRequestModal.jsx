import { useState, useEffect } from "react";
import { Plus, Send, X } from "lucide-react"; // ĐÃ XÓA ChevronDown
import TechRow from "./TechRow";
import useCreateRequest from "../hooks/useCreateRequest";
import axios from "axios";

export default function CreateRequestModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [techs, setTechs] = useState([{ technologyId: "", soLuong: 1 }]);
  const [technologies, setTechnologies] = useState([]);
  const [dateError, setDateError] = useState("");
  const { create, loading } = useCreateRequest();

  // Tính toán ngày mặc định và giới hạn
  const today = new Date();
  const minDate = new Date(today);
  minDate.setMonth(today.getMonth() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  // Auto set default date = +2 tháng
  useEffect(() => {
    if (isOpen && !expectedDate) {
      const defaultDate = new Date(today);
      defaultDate.setMonth(today.getMonth() + 2);
      setExpectedDate(defaultDate.toISOString().split("T")[0]);
    }
  }, [isOpen, expectedDate]);

  // Validate date khi thay đổi
  const handleDateChange = (value) => {
    setExpectedDate(value);
    const selected = new Date(value);
    if (selected < minDate) {
      setDateError("Vui lòng chọn ngày bàn giao tối thiểu sau 2 tháng kể từ hôm nay.");
    } else {
      setDateError("");
    }
  };

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
      axios
        .get("http://localhost:8080/api/hr-request/technologies", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setTechnologies(res.data))
        .catch(() => setTechnologies([]));
    }
  }, [isOpen]);

  const addTech = () => setTechs([...techs, { technologyId: "", soLuong: 1 }]);

  const updateTech = (i, field, value) => {
    const updated = [...techs];
    updated[i][field] = field === "soLuong" ? Math.max(1, value) : value;
    setTechs(updated);
  };

  const removeTech = (i) => {
    if (techs.length <= 1) return;
    setTechs(techs.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dateError || !title || techs.some(t => !t.technologyId)) return;

    const data = {
      requestTitle: title,
      techQuantities: techs
        .filter(t => t.technologyId)
        .map(t => ({
          technologyId: parseInt(t.technologyId),
          soLuong: t.soLuong
        })),
      expectedDeliveryDate: expectedDate,
      note: note || null
    };

    const res = await create(data);
    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal create-modal" role="dialog" aria-modal="true">
        {/* HEADER – ĐÃ XÓA ICON MŨI TÊN */}
        <div className="modal-header-custom">
          <div className="header-title-group">
            <h3>Tạo nhu cầu nhân sự</h3>
            {/* ĐÃ XÓA: <ChevronDown size={18} className="chevron-icon" /> */}
          </div>
          <button
            onClick={onClose}
            className="btn-close-large"
            aria-label="Đóng modal"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* TIÊU ĐỀ */}
            <div className="form-group full-width">
              <label htmlFor="title">Tên nhu cầu <span className="required">*</span></label>
              <input
                id="title"
                type="text"
                maxLength="60"
                placeholder="VD: Tuyển lập trình viên Java Backend"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <small className="help-text">{title.length}/60</small>
            </div>

            {/* CÔNG NGHỆ */}
            <div className="form-group full-width tech-section">
              <div className="section-header">
                <label>Công nghệ <span className="required">*</span></label>
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

            {/* NGÀY BÀN GIAO */}
            <div className="form-group">
              <label htmlFor="deadline">Thời hạn bàn giao <span className="required">*</span></label>
              <div className="input-wrapper-date">
                <input
                  id="deadline"
                  type="date"
                  min={minDateStr}
                  value={expectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                  required
                  className={dateError ? "error" : ""}
                />
              </div>
              {dateError && <small className="error-text">{dateError}</small>}
            </div>

            {/* GHI CHÚ */}
            <div className="form-group full-width">
              <label htmlFor="note">Ghi chú (tùy chọn)</label>
              <textarea
                id="note"
                rows="4"
                maxLength="255"
                placeholder="Ghi chú bổ sung..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-cancel">Hủy</button>
            <button
              type="submit"
              disabled={loading || dateError || !title || techs.some(t => !t.technologyId)}
              className="btn btn-submit"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div> Đang gửi...
                </>
              ) : (
                <>Gửi <Send size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}