import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons"; // ✅ thêm import
import "../styles/plan.css";

const RecruitmentPlanPage = () => {
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
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
                setFilteredPlans(res.data);
                setError(null);
            })
            .catch(() => setError("❌ Không thể tải danh sách kế hoạch tuyển dụng"))
            .finally(() => setLoading(false));
    }, []);

    // --- FILTER LOGIC ---
    useEffect(() => {
        let filtered = [...plans];
        if (searchName.trim()) {
            filtered = filtered.filter((p) =>
                p.planName?.toLowerCase().includes(searchName.toLowerCase())
            );
        }
        if (statusFilter) {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }
        if (dateFilter) {
            filtered = filtered.filter((p) =>
                p.createdAt?.startsWith(dateFilter)
            );
        }
        setFilteredPlans(filtered);
        setCurrentPage(1);
    }, [searchName, statusFilter, dateFilter, plans]);

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentPlans = filteredPlans.slice(indexOfFirst, indexOfLast);

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

            {/* === CONTENT === */}
            <div className="recruitment-page fade-slide">
                <div className="title-row">
                    <h2 className="page-title-small">Kế hoạch tuyển dụng</h2>

                    <div className="filter-bar">
                        {/* Search theo tên */}
                        <div className="filter-item">
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Tìm theo tên..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            <span className="filter-icon">🔍</span>
                        </div>

                        {/* Trạng thái */}
                        <div className="filter-item">
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Trạng thái</option>
                                <option value="PENDING">Đang chờ</option>
                                <option value="IN_PROGRESS">Đang xử lý</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELED">Đã hủy</option>
                            </select>
                        </div>

                        {/* Ngày tạo */}
                        <div className="filter-item">
                            <input
                                type="date"
                                className="filter-date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>

                        {/* Nút thêm kế hoạch */}
                        <button
                            className="add-plan-btn clean"
                            onClick={() => console.log("Thêm kế hoạch tuyển dụng")}
                        >
                            ＋ Thêm kế hoạch tuyển dụng
                        </button>
                    </div>
                </div>

                {/* === Table === */}
                <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
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
                                            {/* ✅ dùng component tái sử dụng */}
                                            <ActionButtons
                                                onView={() => console.log("Xem", plan.recruitmentPlanId)}
                                                onEdit={() => console.log("Chỉnh sửa", plan.recruitmentPlanId)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    )}
                </div>


                {/* === Pagination === */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </Layout>
    );
};

export default RecruitmentPlanPage;