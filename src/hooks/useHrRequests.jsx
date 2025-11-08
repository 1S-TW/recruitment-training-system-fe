import { useState, useEffect } from "react";
import axios from "axios";

export default function useHrRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHRRequests = () => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:8080/api/hr-request", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHRRequests();
  }, []);

  return { requests, loading, refetch: fetchHRRequests };
}
