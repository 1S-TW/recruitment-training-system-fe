// src/hooks/useUpdateRequest.jsx
import { useState } from "react";
import axios from "axios";

export default function useUpdateRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (id, data) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    return axios
      .post(`http://localhost:8080/api/hr-request/update/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setLoading(false);
        return { success: true };
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Lỗi khi cập nhật";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      });
  };

  return { update, loading, error };
}