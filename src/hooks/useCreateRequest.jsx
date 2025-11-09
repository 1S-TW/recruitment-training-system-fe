import { useState } from "react";
import axios from "axios";

export default function useCreateRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async (data) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8080/api/hr-request/create", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Lỗi khi gửi yêu cầu";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}