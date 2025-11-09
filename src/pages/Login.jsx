import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Form/Input';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const auth = useAuth(); // Lấy context

  // --- HÀM BỊ THIẾU LÀ ĐÂY ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  // --- KẾT THÚC SỬA ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    try {
      const data = await login(formData); // data = { token, role, fullName }
      auth.loginUser(data);
      showNotification('Đăng nhập thành công!', 'success');

      if (data.role === 'SUPER_ADMIN') {
        navigate('/admin'); 
      } else if (data.role) {
        navigate('/forbidden'); 
      } else {
         showNotification('Tài khoản của bạn chưa được cấp quyền. Vui lòng liên hệ Admin.', 'error');
         auth.logoutUser(); 
         navigate('/login'); 
      }

    } catch (err) {
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
        {apiError && <div className="api-error-box">{apiError}</div>}
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange} 
          placeholder="Nhập email của bạn"
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange} 
          placeholder="Nhập mật khẩu"
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