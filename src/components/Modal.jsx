// src/components/Modal.jsx - Updated to use new modal system
import React from "react";
import { BaseModal as BaseModalComponent, ModalFooter as ModalFooterComponent } from "./Modal/index";

// Re-export components for backward compatibility
export const BaseModal = BaseModalComponent;
export const ModalFooter = ModalFooterComponent;

// Legacy Modal component for backward compatibility
export default function Modal({ 
  title, 
  width = 600, 
  onClose, 
  children, 
  className = "",
  isOpen = true 
}) {
  // Map width to size
  let size = "md";
  if (width <= 400) size = "sm";
  else if (width <= 600) size = "md";
  else if (width <= 800) size = "lg";
  else size = "xl";

  return (
    <BaseModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      className={className}
    >
      {children}
    </BaseModalComponent>
  );
}
