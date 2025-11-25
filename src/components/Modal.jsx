// src/components/Modal.jsx
import React from "react";
import ReactDOM from "react-dom";

export default function Modal({
  title,
  subtitle = null,
  width = 600,
  onClose,
  children,
}) {
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      onClose && onClose();
    }
  };

  return ReactDOM.createPortal(
    <>
      {/* Nền mờ */}
      <div className="modal-backdrop" onClick={handleBackdropClick} />

      {/* Khung modal */}
      <div
        className="modal-content"
        style={{
          maxWidth: width,
        }}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-title">{title}</h3>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </>,
    document.body // ⭐ Quan trọng: đưa modal ra ngoài layout
  );
}
