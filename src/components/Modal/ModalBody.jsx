import React from "react";

export default function ModalBody({ 
  children, 
  className = "",
  padding = true 
}) {
  const bodyClass = `modal-body ${!padding ? 'no-padding' : ''} ${className}`.trim();
  
  return (
    <div className={bodyClass}>
      {children}
    </div>
  );
}