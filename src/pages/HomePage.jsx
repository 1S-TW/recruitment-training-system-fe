import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/'); // chưa có token thì quay về login
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>Chào mừng bạn đến hệ thống!</h1>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          navigate('/');
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
