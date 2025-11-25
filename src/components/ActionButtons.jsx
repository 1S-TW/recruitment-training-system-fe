import React from "react";
import { Eye, Edit2 } from "lucide-react";
import "../styles/request.css"; // tooltip & style đồng bộ

const ActionButtons = ({ onView, onEdit, canEdit = true }) => {
  const common = "btn-action";
  const dis = !canEdit ? " disabled" : "";

  const guard = (fn) => (e) => {
    if (!canEdit) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return;
    }
    fn?.(e);
  };

  return (
    <div className="btn-group">
      {/* Xem */}
      <div className="btn-action-wrapper">
        <button
          className={`${common} btn-view`}
          onClick={onView}
          data-tooltip="Xem chi tiết"
        >
          <Eye size={18} />
        </button>
        <span className="action-tooltip">Xem chi tiết</span>
      </div>

      {/* Sửa */}
      <div className="btn-action-wrapper">
        <button
          className={`${common} btn-edit${dis}`}
          onClick={guard(onEdit)}
          disabled={!canEdit}
          style={!canEdit ? { cursor: "not-allowed", opacity: 0.5 } : {}}
          data-tooltip={canEdit ? "Chỉnh sửa" : ""}
        >
          <Edit2 size={18} />
        </button>
        {canEdit && <span className="action-tooltip">Chỉnh sửa</span>}
      </div>
    </div>
  );
};

export default ActionButtons;
