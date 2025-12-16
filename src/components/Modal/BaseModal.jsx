import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "../../styles/modal-system.css";
import "../../styles/modal-components.css";
import "../../styles/modal-responsive.css";

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  size = "md", 
  className = "", 
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management and accessibility
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement;
      
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      
      // Focus the modal after a short delay to ensure it's rendered
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
      
      // Announce modal opening to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'modal-sr-only';
      announcement.textContent = `Modal đã mở: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, title]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target.classList.contains("modal-backdrop")) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Modal Backdrop */}
      <div
        className={`modal-backdrop ${className ? `${className}-backdrop` : ""}`.trim()}
        onClick={handleBackdropClick}
        role="presentation"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`modal-content modal-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-body"
        tabIndex="-1"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
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
        </div>

        {/* Modal Body */}
        <div id="modal-body" className="modal-body">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}