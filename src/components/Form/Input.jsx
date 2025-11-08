import React from 'react';
import './Form.css'; // Sẽ tạo ở dưới

/**
 * Component Input tái sử dụng
 * @param {string} label - Tiêu đề của input
 * @param {string} error - Tin nhắn lỗi (nếu có)
 * ...các props khác của input (type, name, value, onChange, placeholder)
 */
const Input = ({ label, error, ...props }) => (
    <div className="form-group">
        <label htmlFor={props.name}>{label}</label>
        <input id={props.name} {...props} />
        {error && <span className="error-message">{error}</span>}
    </div>
);

export default Input;