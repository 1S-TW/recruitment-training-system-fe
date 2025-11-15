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
  mode = "select",
  requestOptions = [],
  onPickRequest,
}) {
  const showFields = mode === "locked" || !!form.requestId;

  const periodText = useMemo(() => {
    if (!form.recruitmentDeadline) return "";
    const end = new Date(form.recruitmentDeadline);
    const start = new Date(end);
    start.setDate(end.getDate() - 14);
    const pad = (n) => String(n).padStart(2, "0");
    return `Từ ${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()} đến ${pad(
      end.getDate()
    )}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
  }, [form.recruitmentDeadline]);

  const deliveryDeadlineStr = useMemo(() => {
    if (!form.deliveryDeadline) return "";
    const d = new Date(form.deliveryDeadline);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, [form.deliveryDeadline]);

  if (!open) return null;

  const canSubmit = !!form.requestId && !!form.planName;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal add-plan-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header-flex">
          <h3 className="modal-title">Thêm kế hoạch tuyển dụng</h3>
          <button className="btn-close-large" onClick={onClose}>✖</button>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit?.();
          }}
        >
          {/* Chọn nhu cầu */}
          {mode === "select" && (
            <div className="form-group">
              <label>Chọn nhu cầu</label>
              <select
                className="input-style"
                value={form.requestId || ""}
                onChange={(e) =>
                  onPickRequest?.(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">— Chọn nhu cầu —</option>
                {requestOptions.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tên nhu cầu */}
          {showFields && (
            <div className="form-group">
              <label>Tên nhu cầu</label>
              <input type="text" className="input-style" value={requestTitle || ""} readOnly />
            </div>
          )}

          {/* Tên kế hoạch */}
          {showFields && (
            <div className="form-group">
              <label>Tên kế hoạch</label>
              <input
                type="text"
                placeholder="Nhập tên kế hoạch"
                className="input-style"
                value={form.planName}
                onChange={(e) => onChange((f) => ({ ...f, planName: e.target.value }))}
                required
              />
            </div>
          )}

          {/* Thời gian tuyển dụng */}
          {showFields && (
            <>
              <div className="form-group">
                <label>Thời gian tuyển dụng</label>
                <input type="text" className="input-style" value={periodText} readOnly />
              </div>

              <div className="form-group">
                <label>Hạn bàn giao</label>
                <input type="text" className="input-style" value={deliveryDeadlineStr} readOnly />
              </div>
            </>
          )}

          {/* Bảng công nghệ */}
          {showFields && Array.isArray(techSummary) && techSummary.length > 0 && (
            <div className="form-group">
              <label>Chi tiết công nghệ</label>

              <div className="tech-table-wrapper">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th className="center">CÔNG NGHỆ</th>
                      <th className="center">NV ĐẦU VÀO</th>
                      <th className="center">NV ĐẦU RA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techSummary.map((t, i) => {
                      const inQty = Number(t.soLuong ?? t.quantity ?? 0) || 0;
                      const outQty = inQty * 2;
                      return (
                        <tr key={i}>
                          <td className="center">{t.technologyName || t.technology || "-"}</td>
                          <td className="center">{inQty}</td>
                          <td className="center">{outQty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer-flex">
            <button type="button" className="btn-gray" onClick={onClose}>
              Hủy
            </button>

            <button type="submit" className="btn-green" disabled={!canSubmit}>
              Tạo kế hoạch
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
