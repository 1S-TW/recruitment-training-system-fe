
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import Input from "../components/Form/Input";
import "../styles/login.css";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const auth = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError(null);

        try {
            const data = await login(formData); // { token, role, fullName }
            auth.loginUser(data);
            showNotification("Đăng nhập thành công!", "success");

            if (data.role === "SUPER_ADMIN") {
                navigate("/admin");
            } else if (data.role) {
                navigate("/forbidden");
            } else {
                showNotification(
                    "Tài khoản của bạn chưa được cấp quyền. Vui lòng liên hệ Admin.",
                    "error"
                );
                auth.logoutUser();
                navigate("/login");
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu";
            setApiError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-wrapper">
                <form className="login-card" onSubmit={handleSubmit}>
                    <h2 className="login-title">Đăng Nhập</h2>

                    {apiError && <div className="error-text">{apiError}</div>}

                    <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập email của bạn"
                        required
                    />
                    <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu"
                        required
                    />

                    <button
                        type="submit"
                        className={`login-btn ${loading ? "loading" : ""}`}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner"></span> : "Đăng Nhập"}
                    </button>

                    <div className="login-footer">
                        <Link to="/register">Tạo tài khoản mới</Link> |{" "}
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
