import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
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

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "in_progress":
        return "status-progress";
      case "completed":
        return "status-completed";
      case "canceled":
        return "status-canceled";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="recruitment-page">
        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Tuyển dụng</span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-current">Kế hoạch tuyển dụng</span>
          </div>

          <h2 className="page-title">Kế hoạch tuyển dụng</h2>
        </div>

        {/* Table */}
        <div className="table-container">
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
                  <th className="text-center">Hành động</th>
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
                  plans.map((plan, index) => (
                    <tr key={plan.recruitmentPlanId || index}>
                      <td>{index + 1}</td>
                      <td>{plan.planName}</td>
                      <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(plan.status)}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td>
                        {plan.request?.createdBy?.fullName ||
                          plan.request?.createdBy?.username ||
                          "Không rõ"}
                      </td>
                      <td className="text-center">
                        <div className="btn-group">
                          <div className="btn-action-wrapper">
                            <button
                              className="btn-action btn-view"
                              onClick={() => console.log("Xem", plan.recruitmentPlanId)}
                            >
                              <svg
                                className="icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                ></path>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                ></path>
                              </svg>
                            </button>
                            <span className="action-tooltip">Xem chi tiết</span>
                          </div>

                          <div className="btn-action-wrapper">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => console.log("Chỉnh sửa", plan.recruitmentPlanId)}
                            >
                              <svg
                                className="icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                ></path>
                              </svg>
                            </button>
                            <span className="action-tooltip">Chỉnh sửa kế hoạch</span>
                          </div>
                        </div>
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
