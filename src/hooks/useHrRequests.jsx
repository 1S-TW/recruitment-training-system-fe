// src/hooks/useHrRequests.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function useHrRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHRRequests = async () => {
    const token = localStorage.getItem("token");

    // Nếu không có token, redirect về /login
    if (!token) {
      console.warn("⛔ Không có token, redirect về /login");
      navigate("/login", { replace: true });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8080/api/hr-request", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi fetch HR Requests:", err);

      // Nếu server trả 401 hoặc 403 → token hết hạn hoặc không hợp lệ
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRRequests();
  }, []);

  return { requests, loading, refetch: fetchHRRequests };
}