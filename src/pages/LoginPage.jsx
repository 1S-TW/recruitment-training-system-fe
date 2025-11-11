import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { loginUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.token) {
        loginUser(data.token, email); // ✅ Cập nhật state + localStorage
        navigate("/");
      }
    } catch (err) {
      setError("Sai email hoặc mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };


  return (
  <div className="login-page">
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Đăng nhập hệ thống</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="login-footer">
            <a href="#">Quên mật khẩu?</a>
            <span> | </span>
            <a href="#">Đăng ký tài khoản</a>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}

export default LoginPage;
