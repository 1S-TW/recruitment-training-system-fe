import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/plan.css";

const RecruitmentPlanPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("⚠️ Bạn chưa đăng nhập hoặc token đã hết hạn");
            setLoading(false);
            return;
        }

        axios
            .get("http://localhost:8080/api/recruitment-plans", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setPlans(res.data);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("❌ Không thể tải danh sách kế hoạch tuyển dụng");
            })
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(plans.length / itemsPerPage) || 1;
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentPlans = plans.slice(indexOfFirst, indexOfLast);

    const handleChangeItemsPerPage = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPage(page);
            setIsAnimating(false);
        }, 180);
    };

    // === Pagination logic with ellipsis ===
    const getVisiblePages = () => {
        const totalNumbers = 7;
        const totalBlocks = totalNumbers + 2; // include first & last
        if (totalPages <= totalBlocks) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const startPage = Math.max(2, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);
        let pages = [];

        if (currentPage > 4) pages.push(1, "prevDots");
        else pages.push(...Array.from({ length: Math.min(4, totalPages - 1) }, (_, i) => i + 1));

        for (let i = startPage; i <= endPage; i++) {
            if (i > 1 && i < totalPages) pages.push(i);
        }

        if (currentPage < totalPages - 3) pages.push("nextDots", totalPages);
        else if (!pages.includes(totalPages)) pages.push(totalPages);

        return [...new Set(pages)];
    };

    return (
        <Layout>
            {/* === Breadcrumb === */}
            <div className="breadcrumb-container fade-slide">
                <div className="breadcrumb-left">
                    <span className="breadcrumb-icon">💼</span>
                    <span className="breadcrumb-item">Tuyển dụng</span>
                    <span className="breadcrumb-separator">&gt;</span>
                    <span className="breadcrumb-current">Kế hoạch tuyển dụng</span>
                </div>

                <div className="breadcrumb-right">
                    <div className="mini-pagination">
                        <label className="mini-pagination-label">Hiển thị:</label>
                        <select
                            value={itemsPerPage}
                            onChange={handleChangeItemsPerPage}
                            className="mini-pagination-select"
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* === Title === */}
            <div className="recruitment-page fade-slide">
                <div className="title-row">
                    <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>
                </div>

                {/* === Table === */}
                <div className={`table-container ${isAnimating ? "fade-out" : "fade-in"}`}>
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
                                <th className="actions-head text-center">Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentPlans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                currentPlans.map((plan, index) => (
                                    <tr key={plan.recruitmentPlanId || index}>
                                        <td>{indexOfFirst + index + 1}</td>
                                        <td>{plan.planName}</td>
                                        <td>
                                            {plan.createdAt
                                                ? new Date(plan.createdAt).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td>
                                            <span className="status-badge">{plan.status}</span>
                                        </td>
                                        <td>
                                            {plan.request?.createdBy?.fullName ||
                                                plan.request?.createdBy?.username ||
                                                "Không rõ"}
                                        </td>
                                        <td className="actions-cell text-center">
                                            <div className="btn-group">
                                                <div className="btn-action-wrapper">
                                                    <button
                                                        className="btn-action btn-view"
                                                        onClick={() =>
                                                            console.log("Xem", plan.recruitmentPlanId)
                                                        }
                                                    >
                                                        👁
                                                    </button>
                                                    <span className="action-tooltip">Xem chi tiết</span>
                                                </div>
                                                <div className="btn-action-wrapper">
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() =>
                                                            console.log("Chỉnh sửa", plan.recruitmentPlanId)
                                                        }
                                                    >
                                                        ✏️
                                                    </button>
                                                    <span className="action-tooltip">Chỉnh sửa</span>
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

                {/* === Pagination (Jira-style, with ... and jump first/last) === */}
                <div className="pagination-controls clean-pagination">
                    <button
                        className="nav-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>

                    <div className="page-numbers">
                        {getVisiblePages().map((num, i) =>
                            num === "prevDots" ? (
                                <span key={`prev-${i}`} className="dots">...</span>
                            ) : num === "nextDots" ? (
                                <span key={`next-${i}`} className="dots">...</span>
                            ) : (
                                <button
                                    key={num}
                                    onClick={() => handlePageChange(num)}
                                    className={`btn-page-number ${
                                        currentPage === num ? "active-page" : ""
                                    }`}
                                >
                                    {num}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        className="nav-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default RecruitmentPlanPage;