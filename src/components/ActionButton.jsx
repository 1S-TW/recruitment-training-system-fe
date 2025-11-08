import React from "react";
import { Eye, Edit2 } from "lucide-react";
import "../styles/button.css";

export default function ActionButtons({ onView, onEdit }) {
  return (
    <div className="btn-group">
      <button
        className="btn-action btn-view"
        onClick={onView}
        data-tooltip="Xem chi tiết"
      >
        <Eye size={18} />
      </button>
      <button
        className="btn-action btn-edit"
        onClick={onEdit}
        data-tooltip="Chỉnh sửa"
      >
        <Edit2 size={18} />
      </button>
    </div>
  );
}
