import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';
import Input from '../components/Form/Input';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError(null);

        try {
            const data = await login(formData);

            // 1. Lưu token (để đăng nhập)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ role: data.role, fullName: data.fullName }));

            // 2. Hiển thị thông báo thành công (2-3 giây)
            showNotification('Đăng nhập thành công!', 'success');

            // 3. Chuyển hướng đến Dashboard (tạm thời /)
            navigate('/'); // (Sau này đổi thành '/dashboard')

        } catch (err) {
            // 4. Hiển thị thông báo lỗi (dòng báo đỏ)
            const errorMsg = err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu';
            setApiError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Đăng Nhập</h2>

                {/* Đây là dòng báo đỏ khi API lỗi */}
                {apiError && <div className="api-error-box">{apiError}</div>}

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập email của bạn" // Yêu cầu của bạn
                    required
                />
                <Input
                    label="Mật khẩu"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu" // Yêu cầu của bạn
                    required
                />

                <button type="submit" disabled={loading} className="auth-button">
                    {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                </button>

                <div className="auth-links">
                    <Link to="/register">Tạo tài khoản mới</Link>
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;