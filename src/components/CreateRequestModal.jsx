// src/components/CreateRequestModal.jsx
import { useState, useEffect } from "react";
import { Plus, Send, X } from "lucide-react";
import TechRow from "./TechRow";
import useCreateRequest from "../hooks/useCreateRequest.jsx";
import useUpdateRequest from "../hooks/useUpdateRequest.jsx";
import axios from "axios";

export default function CreateRequestModal({ isOpen, onClose, onSuccess, initialData }) {
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

  // TẢI DỮ LIỆU KHI MỞ MODAL
  useEffect(() => {
    if (isOpen && isEdit && initialData) {
      setTitle(initialData.requestTitle || "");
      setExpectedDate(initialData.expectedDeliveryDate || "");
      setNote(initialData.note || "");
      setTechs(
        initialData.techQuantities?.length > 0
          ? initialData.techQuantities.map(t => ({
              technologyId: t.technologyId.toString(),
              soLuong: t.soLuong
            }))
          : [{ technologyId: "", soLuong: 1 }]
      );
    } else if (isOpen && !isEdit) {
      setTitle("");
      setNote("");
      const defaultDate = new Date(today);
      defaultDate.setMonth(today.getMonth() + 2);
      setExpectedDate(defaultDate.toISOString().split("T")[0]);
      setTechs([{ technologyId: "", soLuong: 1 }]);
    }
  }, [isOpen, isEdit, initialData]);

  // TẢI DANH SÁCH CÔNG NGHỆ
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

  const handleDateChange = (value) => {
    setExpectedDate(value);
    const selected = new Date(value);
    if (selected < minDate) {
      setDateError("Vui lòng chọn ngày bàn giao tối thiểu sau 2 tháng kể từ hôm nay.");
    } else {
      setDateError("");
    }
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dateError || !title || techs.some(t => !t.technologyId)) return;

    const data = {
      requestTitle: title,
      expectedDeliveryDate: expectedDate,
      note: note || null,
      techQuantities: techs
        .filter(t => t.technologyId)
        .map(t => ({
          technologyId: parseInt(t.technologyId),
          soLuong: t.soLuong
        }))
    };

    if (isEdit) {
      update(initialData.requestId, data).then(res => {
        if (res && res.success) {
          onSuccess();
          onClose();
        }
      });
    } else {
      create(data).then(res => {
        if (res && res.success) {
          onSuccess();
          onClose();
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal create-modal" role="dialog" aria-modal="true">
        <div className="modal-header-custom">
          <div className="header-title-group">
            <h3>{isEdit ? "Chỉnh sửa nhu cầu" : "Tạo nhu cầu nhân sự"}</h3>
          </div>
          <button onClick={onClose} className="btn-close-large" aria-label="Đóng modal">
            <X size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
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

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-cancel">Hủy</button>
            <button
              type="submit"
              disabled={loading || dateError || !title || techs.some(t => !t.technologyId)}
              className="btn btn-submit"
              aria-busy={loading}
            >
              {loading ? (
                <>Đang xử lý...</>
              ) : (
                <>{isEdit ? "Cập nhật" : "Gửi"} <Send size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}