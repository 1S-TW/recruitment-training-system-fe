// src/pages/RecruitmentPlanPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // ⬅️ để đọc query
import axios from "axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons";
import AddPlanModal from "../components/AddPlanModal"; // ⬅️ mới
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

    // Modal & form state
    const [openAddModal, setOpenAddModal] = useState(false);
    const [techSummary, setTechSummary] = useState([]);
    const [form, setForm] = useState({
        requestId: undefined,
        planName: "",
        status: "DRAFT",
        recruitmentDeadline: "",
        deliveryDeadline: "",
        note: "",
    });

    const location = useLocation();
    const token = localStorage.getItem("token");
    const axiosAuth = axios.create({
        baseURL: "http://localhost:8080",
        headers: { Authorization: `Bearer ${token}` },
    });

    // Load list plans
    const loadPlans = async () => {
        try {
            setLoading(true);
            const res = await axiosAuth.get("/api/recruitment-plans");
            setPlans(res.data);
            setFilteredPlans(res.data);
            setError(null);
        } catch (e) {
            setError("❌ Không thể tải danh sách kế hoạch tuyển dụng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPlans(); }, []);

    // ⬅️ Auto-open modal nếu có requestId trong URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestId = params.get("requestId");

        if (requestId) {
            (async () => {
                try {
                    const res = await axiosAuth.get(`/api/hr-request/${requestId}/plan-defaults`);
                    const d = res.data;
                    setForm({
                        requestId: d.requestId,
                        planName: d.requestTitle || d.suggestedPlanName || "",
                        status: d.status || "DRAFT",
                        recruitmentDeadline: d.recruitmentDeadline || "",
                        deliveryDeadline: d.deliveryDeadline || "",
                        note: d.note || "",
                    });
                    setTechSummary(d.techQuantities || []);
                    setOpenAddModal(true);
                } catch {
                    // Fallback: vẫn mở modal để người dùng nhập tay nếu defaults lỗi
                    setForm((f) => ({ ...f, requestId }));
                    setOpenAddModal(true);
                }
            })();
        }
    }, [location.search]);

    // Filter giữ nguyên logic
    useEffect(() => {
        let filtered = [...plans];
        if (searchName.trim()) {
            filtered = filtered.filter((p) => p.planName?.toLowerCase().includes(searchName.toLowerCase()));
        }
        if (statusFilter) {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }
        if (dateFilter) {
            filtered = filtered.filter((p) => p.createdAt?.startsWith(dateFilter));
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

    // ⬅️ "Thêm Plan" thường → mở modal rỗng
    const openEmptyAddModal = () => {
        setTechSummary([]);
        setForm({
            requestId: undefined,        // không gắn request
            planName: "",
            status: "DRAFT",
            recruitmentDeadline: "",
            deliveryDeadline: "",
            note: "",
        });
        setOpenAddModal(true);
    };

    // ⬅️ Submit tạo Plan
    const submitPlan = async () => {
        try {
            if (!form.planName || !form.recruitmentDeadline || !form.deliveryDeadline) {
                alert("⚠️ Vui lòng điền đầy đủ Tên kế hoạch, Hạn tuyển dụng, Hạn bàn giao");
                return;
            }
            await axiosAuth.post("/api/recruitment-plans", form);
            setOpenAddModal(false);
            await loadPlans();
            alert("✅ Tạo kế hoạch thành công!");
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Lỗi không xác định";
            alert(`⚠️ Không thể tạo kế hoạch: ${msg}`);
        }
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
                        <select value={itemsPerPage} onChange={handleChangeItemsPerPage} className="mini-pagination-select">
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

                        {/* Trạng thái (thêm DRAFT để khớp backend) */}
                        <div className="filter-item">
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Trạng thái</option>
                                <option value="DRAFT">Nháp</option>
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

                        {/* Nút thêm kế hoạch (thêm thường) */}
                        <button
                            className="add-plan-btn clean"
                            onClick={openEmptyAddModal}
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
                                    <td colSpan="6" className="text-center">Không có dữ liệu</td>
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
                                        <td><span className="status-badge">{plan.status}</span></td>
                                        <td>
                                            {plan.request?.createdBy?.fullName ||
                                                plan.request?.createdBy?.username ||
                                                "Không rõ"}
                                        </td>
                                        <td className="actions-cell text-center">
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

            {/* === Modal Thêm Plan (auto-open nếu có requestId) === */}
            <AddPlanModal
                open={openAddModal}
                onClose={() => setOpenAddModal(false)}
                form={form}
                onChange={setForm}
                onSubmit={submitPlan}
                techSummary={techSummary}
            />
        </Layout>
    );
};

export default RecruitmentPlanPage;