// src/components/AddPlanModal.jsx
import { useMemo } from "react";

export default function AddPlanModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  techSummary = [],
  requestTitle = "",
}) {
  const recruitmentStartStr = useMemo(() => {
    if (!form.recruitmentDeadline) return "";
    const end = new Date(form.recruitmentDeadline);
    const start = new Date(end);
    start.setDate(end.getDate() - 14);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
  }, [form.recruitmentDeadline]);

  const recruitmentEndStr = useMemo(() => {
    if (!form.recruitmentDeadline) return "";
    const end = new Date(form.recruitmentDeadline);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
  }, [form.recruitmentDeadline]);

  const deliveryDeadlineStr = useMemo(() => {
    if (!form.deliveryDeadline) return "";
    const d = new Date(form.deliveryDeadline);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, [form.deliveryDeadline]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 560 }}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>Thêm kế hoạch tuyển dụng</h3>
          <button className="btn-close-large" onClick={onClose} aria-label="Đóng">✖</button>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          {/* Tên nhu cầu (readonly) */}
          <div className="form-group">
            <label>Tên nhu cầu</label>
            <input type="text" value={requestTitle || ""} readOnly />
          </div>

          {/* Tên kế hoạch */}
          <div className="form-group">
            <label>Tên kế hoạch</label>
            <input
              type="text"
              placeholder="Nhập tên kế hoạch"
              value={form.planName}
              onChange={(e) => onChange((f) => ({ ...f, planName: e.target.value }))}
              required
            />
          </div>

          {/* Thời gian tuyển dụng: read-only */}
          <div className="form-group">
            <label>Thời gian tuyển dụng</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" value={recruitmentStartStr ? `Từ ${recruitmentStartStr}` : ""} readOnly />
              <input type="text" value={recruitmentEndStr ? `Đến ${recruitmentEndStr} (14 ngày)` : ""} readOnly />
            </div>
            {/* Hidden để submit đúng end-date lên BE */}
            <input type="hidden" value={form.recruitmentDeadline || ""} readOnly />
          </div>

          {/* Hạn bàn giao: read-only */}
          <div className="form-group">
            <label>Hạn bàn giao</label>
            <input type="text" value={deliveryDeadlineStr} readOnly />
            <input type="hidden" value={form.deliveryDeadline || ""} readOnly />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              rows="4"
              placeholder="Nhập ghi chú (nếu có)…"
              value={form.note || ""}
              onChange={(e) => onChange((f) => ({ ...f, note: e.target.value }))}
            />
          </div>

          {Array.isArray(techSummary) && techSummary.length > 0 && (
            <div className="form-group">
              <label>Chi tiết công nghệ</label>
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>CÔNG NGHỆ</th>
                    <th>SỐ LƯỢNG</th>
                  </tr>
                </thead>
                <tbody>
                  {techSummary.map((t, i) => (
                    <tr key={i}>
                      <td>{t.technologyName || t.technology || "-"}</td>
                      <td>{t.soLuong ?? t.quantity ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-submit">Tạo kế hoạch</button>
          </div>
        </form>
      </div>
    </>
  );
}
