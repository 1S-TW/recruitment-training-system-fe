import React from "react";

export default function ModalHeader({ 
  title, 
  onClose, 
  variant = "primary",
  showCloseButton = true,
  children 
}) {
  const headerClass = variant === "secondary" ? "modal-header modal-header-light" : "modal-header";
  
  return (
    <div className={headerClass}>
      {children ? (
        children
      ) : (
        <>
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Đóng modal"
              type="button"
            >
              ✕
            </button>
          )}
        </>
      )}
    </div>
  );
}