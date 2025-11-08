import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import ActionButtons from "../components/ActionButton";
import "../styles/plan.css";

const RecruitmentPlanPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("⚠️ Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get("http://localhost:8080/api/recruitment-plans", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("✅ API Response:", res.data);
        setPlans(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("🚫 Không có quyền truy cập hoặc token không hợp lệ");
        } else {
          setError("❌ Không thể tải danh sách kế hoạch tuyển dụng");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <Layout>
      <div className="page recruitment-page fade-in">
        {/* --- Header Section --- */}
        <div className="page-header left-align">
          {/* 🧭 Breadcrumb */}
          <div className="breadcrumb large">
            <span className="breadcrumb-text">Tuyển dụng</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Kế hoạch tuyển dụng</span>
          </div>

          {/* 🏷 Main Title */}
          <h2 className="page-title-clean">Kế hoạch tuyển dụng</h2>
        </div>

        {/* --- Table Section --- */}
        <div className="table-container slide-up">
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên kế hoạch</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Người gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  plans.map((p, index) => (
                    <tr key={p.recruitmentPlanId}>
                      <td>{index + 1}</td>
                      <td className="plan-name">{p.planName}</td>
                      <td>{new Date(p.createdAt).toLocaleString()}</td>
                      <td>
                        <span
                          className={`status-badge status-${p.status?.toLowerCase()}`}
                        >
                          {p.status
                            ? p.status.charAt(0).toUpperCase() +
                              p.status.slice(1).toLowerCase()
                            : "Không rõ"}
                        </span>
                      </td>
                      <td>
                        {p.request?.createdBy?.fullName ||
                          p.request?.createdBy?.username ||
                          "Không rõ"}
                      </td>
                      <td>
                        <ActionButtons
                          onView={() =>
                            console.log("View", p.recruitmentPlanId)
                          }
                          onEdit={() =>
                            console.log("Edit", p.recruitmentPlanId)
                          }
                          onDelete={() =>
                            console.log("Delete", p.recruitmentPlanId)
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecruitmentPlanPage;
