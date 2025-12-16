import React from "react";

export default function ModalFooter({ 
  primaryAction,
  secondaryAction,
  variant = "primary",
  children,
  className = ""
}) {
  const footerClass = `modal-footer ${variant === "light" ? "modal-footer-light" : ""} ${className}`.trim();
  
  if (children) {
    return <div className={footerClass}>{children}</div>;
  }
  
  return (
    <div className={footerClass}>
      {secondaryAction && (
        <button
          type="button"
          className="modal-btn btn-secondary"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
        >
          {secondaryAction.label}
        </button>
      )}
      {primaryAction && (
        <button
          type={primaryAction.type || "button"}
          className="modal-btn btn-primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
        >
          {primaryAction.loading ? (
            <>
              <span className="modal-spinner" />
              Đang xử lý...
            </>
          ) : (
            primaryAction.label
          )}
        </button>
      )}
    </div>
  );
}