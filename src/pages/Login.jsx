import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useNotification } from "../contexts/NotificationContext";
import Input from "../components/Form/Input";
import "../styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ role: data.role, fullName: data.fullName })
      );

      showNotification("Đăng nhập thành công!", "success");
      navigate("/");
      console.log("✅ Đăng nhập thành công, chuyển hướng về /");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Sai email hoặc mật khẩu. Vui lòng thử lại.";
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-card">
          <h2>Đăng nhập hệ thống</h2>
          {apiError && <p className="error-text">{apiError}</p>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mật khẩu"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <div className="login-footer">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
              <span> | </span>
              <Link to="/register">Đăng ký tài khoản</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
