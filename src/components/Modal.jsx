// src/components/Modal.jsx
import React from "react";
import { X } from "lucide-react";
import "../styles/plan.css"; // Chúng ta sẽ thêm CSS modal vào đây

const Modal = ({ children, onClose, title, width = 500 }) => {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content" style={{ maxWidth: `${width}px` }}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
};

export default Modal;