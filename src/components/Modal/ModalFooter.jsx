// src/components/Modal/ModalFooter.jsx
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
    return <div className={footerClass} style={{ backgroundColor: '#ffffff' }}>{children}</div>; // ✅ Thêm màu trắng
  }
  
  return (
    // ✅ Thêm màu trắng inline để ghi đè các style xám yếu hơn
    <div 
      className={footerClass} 
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: '#ffffff' 
      }}
    > 
      
      {/* 1. Bên trái: Secondary Action (Hủy) */}
      <div style={{ display: 'flex' }}> 
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
      </div>

      {/* 2. Bên phải: Primary Action (Lưu/Xác nhận) */}
      <div style={{ display: 'flex', gap: '10px' }}> 
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
    </div>
  );
}