import React from "react";
import { Eye, Edit2 } from "lucide-react";
import "../styles/plan.css"; // dùng chung plan.css để tooltip & hiệu ứng đồng bộ

const ActionButtons = ({ onView, onEdit }) => {
    return (
        <div className="btn-group">
            <div className="btn-action-wrapper">
                <button
                    className="btn-action btn-view"
                    onClick={onView}
                    data-tooltip="Xem chi tiết"
                >
                    <Eye size={40} />
                </button>
                <span className="action-tooltip">Xem chi tiết</span>
            </div>

            <div className="btn-action-wrapper">
                <button
                    className="btn-action btn-edit"
                    onClick={onEdit}
                    data-tooltip="Chỉnh sửa"
                >
                    <Edit2 size={40} />
                </button>
                <span className="action-tooltip">Chỉnh sửa</span>
            </div>
        </div>
    );
};

export default ActionButtons;