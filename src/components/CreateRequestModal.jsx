import { useState, useEffect } from "react";
import { Plus, Send, X } from "lucide-react";
import { BaseModal, ModalFooter } from "./Modal";
import TechRow from "./TechRow";
import useCreateRequest from "../hooks/useCreateRequest.jsx";
import useUpdateRequest from "../hooks/useUpdateRequest.jsx";
import axios from "axios";
import "../styles/CreateRequestModal.css";

export default function CreateRequestModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) {
  // ====== Giữ NGUYÊN LOGIC GỐC ======
  const isEdit = !!initialData;

  const [titleMain, setTitleMain] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [techs, setTechs] = useState([{ technologyId: "", soLuong: "1" }]);
  const [technologies, setTechnologies] = useState([]);
  const [dateError, setDateError] = useState("");

  const { create, loading: createLoading } = useCreateRequest();
  const { update, loading: updateLoading } = useUpdateRequest();
  const loading = createLoading || updateLoading;

  // === SỬA: ĐỒNG BỘ LOGIC 2 THÁNG VỚI BACKEND ===
  const today = new Date();
  const minDate = new Date(today);
  minDate.setMonth(today.getMonth() + 2);
  minDate.setDate(minDate.getDate() + 15);
  // minDate.setDate(minDate.getDate() + 15); // <-- ĐÃ BỎ dòng này để khớp BE
  const minDateStr = minDate.toISOString().split("T")[0];

  // ====== Khóa scroll nền & bắt phím Esc ======
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "";
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
      const existingTitle = initialData.requestTitle || "";
      let extractedMain = existingTitle;
      const prefixMatch = existingTitle.match(/^Nhu cầu nhân sự\s*(.*)$/i);
      if (prefixMatch) {
        extractedMain = prefixMatch[1];
        const beforeMonth = extractedMain.split(/tháng/i)[0].trim();
        if (beforeMonth) extractedMain = beforeMonth;
      }

      setTitleMain(extractedMain.trim());
      setExpectedDate(initialData.expectedDeliveryDate || "");
      setNote(initialData.note || "");
      setTechs(
        initialData.techQuantities?.length > 0
          ? initialData.techQuantities.map((t) => ({
            technologyId: String(t.technologyId),
            soLuong:
              t.soLuong !== undefined && t.soLuong !== null
                ? t.soLuong.toString()
                : "1",
          }))
          : [{ technologyId: "", soLuong: "1" }]
      );
      setDateError("");
    } else if (!isEdit) {
      setTitleMain("");
      setNote("");
      const defaultDate = new Date(minDate);
      setExpectedDate(defaultDate.toISOString().split("T")[0]);
      setTechs([{ technologyId: "", soLuong: "1" }]);
      setDateError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!value) {
      setDateError("");
      return;
    }
    const selected = new Date(value);
    // So sánh với minDate (đã trừ giờ phút giây để so sánh chính xác ngày)
    const minDateZeroTime = new Date(minDateStr);
    if (selected < minDateZeroTime) {
      setDateError(
        "Vui lòng chọn ngày bàn giao tối thiểu sau 2 tháng kể từ hôm nay."
      );
    } else {
      setDateError("");
    }
  };

  // ====== Tech rows ======
  const addTech = () =>
    setTechs((prev) => [...prev, { technologyId: "", soLuong: "1" }]);

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
    setTechs((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)
    );
  };

  const getAvailableTechnologies = (rowIndex) => {
    if (!Array.isArray(technologies) || technologies.length === 0) return [];
    const usedIds = new Set(
      techs
        .map((t, idx) => (idx === rowIndex ? null : t.technologyId))
        .filter(Boolean)
        .map(String)
    );
    return technologies.filter((t) => !usedIds.has(String(t.id ?? t.technologyId)));
  };

  // ====== TÍNH THÁNG NĂM ======
  const baseForMonth = expectedDate ? new Date(expectedDate) : minDate;
  const mm = String(baseForMonth.getMonth() + 1).padStart(2, "0");
  const yyyy = baseForMonth.getFullYear();
  const monthDisplay = `tháng ${mm}, ${yyyy}`;
  const monthPartForTitle = `tháng ${mm}/${yyyy}`;

  const basePrefix = "Nhu cầu nhân sự ";
  const baseSuffix = ` ${monthPartForTitle}`;
  const maxTitleLength = 60;
  const maxMainLength = Math.max(
    0,
    maxTitleLength - basePrefix.length - baseSuffix.length
  );

  const combinedTitle = (
    titleMain.trim()
      ? `${basePrefix}${titleMain.trim()}${baseSuffix}`
      : `${basePrefix}${baseSuffix}`
  ).slice(0, maxTitleLength);

  const hasInvalidTech = techs.some(
    (t) => !t.technologyId || !t.soLuong || Number(t.soLuong) <= 0
  );

  // ====== Submit ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (dateError || !titleMain.trim() || hasInvalidTech) return;

    const data = {
      requestTitle: combinedTitle,
      expectedDeliveryDate: expectedDate,
      note: note || null,
      techQuantities: techs
        .filter((t) => t.technologyId && t.soLuong)
        .map((t) => ({
          technologyId: parseInt(t.technologyId, 10),
          soLuong: Number(t.soLuong),
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
      } catch (_) { }
      onSuccess?.(res.message);
      onClose?.();
    } else if (res?.error) {
      alert(res.error);
    }
  };

  if (!isOpen) return null;

  const titleText = isEdit ? "Chỉnh sửa nhu cầu nhân sự" : "Tạo nhu cầu nhân sự";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      className="create-request-modal"
    >
      <form onSubmit={handleSubmit}>
        {/* Tên nhu cầu */}
        <div className="modal-form-group full-width">
          <label className="modal-form-label">
            Tên nhu cầu <span style={{ color: "var(--modal-error)" }}>*</span>
          </label>
          <div className="modal-form-row">
            <span style={{ 
              padding: "10px 12px", 
              background: "var(--modal-secondary)", 
              borderRadius: "var(--modal-border-radius-sm)",
              fontSize: "var(--modal-body-size)",
              fontWeight: "600"
            }}>
              Nhu cầu nhân sự
            </span>
            <input
              type="text"
              maxLength={maxMainLength}
              placeholder="VD: tuyển lập trình viên Java Backend"
              value={titleMain}
              onChange={(e) => setTitleMain(e.target.value)}
              required
              className="modal-form-input"
              style={{ flex: 1 }}
            />
            <span style={{ 
              padding: "10px 12px", 
              background: "var(--modal-secondary)", 
              borderRadius: "var(--modal-border-radius-sm)",
              fontSize: "var(--modal-body-size)",
              fontWeight: "600"
            }}>
              {monthDisplay}
            </span>
          </div>
        </div>

        {/* Công nghệ */}
        <div className="modal-form-group full-width">
          <label className="modal-form-label">
            Công nghệ <span style={{ color: "var(--modal-error)" }}>*</span>
          </label>
          
          <div style={{ maxHeight: "240px", overflowY: "auto", marginBottom: "12px" }}>
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

          <button
            type="button"
            onClick={addTech}
            className="modal-btn btn-secondary"
            style={{ 
              width: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.875rem"
            }}
          >
            <Plus size={14} /> Thêm công nghệ
          </button>
        </div>

        {/* Thời hạn bàn giao */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Thời hạn bàn giao <span style={{ color: "var(--modal-error)" }}>*</span>
          </label>
          <input
            type="date"
            min={minDateStr}
            value={expectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            required
            className={`modal-form-input ${dateError ? "error" : ""}`}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
          />
          {dateError && (
            <span className="modal-error-message">{dateError}</span>
          )}
        </div>

        {/* Ghi chú */}
        <div className="modal-form-group full-width">
          <label className="modal-form-label">Ghi chú (tùy chọn)</label>
          <textarea
            rows="4"
            maxLength="255"
            placeholder="Ghi chú bổ sung..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="modal-form-textarea"
          />
        </div>

        <ModalFooter
          secondaryAction={{
            label: "Hủy",
            onClick: onClose,
            disabled: loading
          }}
          primaryAction={{
            label: loading ? "Đang xử lý..." : (isEdit ? "Cập nhật" : "Gửi"),
            onClick: handleSubmit,
            loading: loading,
            disabled: loading || !!dateError || hasInvalidTech || !titleMain.trim(),
            type: "submit"
          }}
        />
      </form>
    </BaseModal>
  );
}