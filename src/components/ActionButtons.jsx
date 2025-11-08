import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import "../styles/button.css";

export default function ActionButtons({ onView, onEdit, onDelete }) {
  return (
    <div className="btn-group">
      <button className="btn-action btn-view" onClick={onView} title="Xem chi tiết">
        <Eye size={18} />
      </button>
      <button className="btn-action btn-edit" onClick={onEdit} title="Chỉnh sửa">
        <Edit size={18} />
      </button>
    </div>
  );
}
