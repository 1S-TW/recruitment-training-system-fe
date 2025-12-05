// src/pages/TrainingManagementPage.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ActionButtons from "../components/ActionButtons.jsx";
import EditTrainingModal from "../components/EditTrainingModal";
import { FiSearch } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext"; // ✅ Import AuthContext
import "../styles/toast.css";
import "../styles/training.css";

// 🔹 NEW: Trợ lý AI
import AIAssistantBubble from "../components/AIAssistantBubble";

// Trả về class màu dựa trên trạng thái
const getStatusClass = (status) => {
  switch (status) {
    case "Đang thực tập":
      return "status-intern"; // màu xanh dương
    case "Đã hoàn thành":
      return "status-completed"; // màu xanh lá
    case "Đã dừng thực tập":
      return "status-stopped"; // màu đỏ
    default:
      return "status-unknown"; // màu xám
  }
};

// Trả về nhãn hiển thị
const getStatusLabel = (status) => status || "Đang thực tập";

export default function TrainingManagementPage() {
  // ✅ 1. Lấy thông tin user để phân quyền
  const { user } = useAuth();
  const role = user?.role;

  // ✅ 2. Định nghĩa quyền tương tác
  // HR và LEAD chỉ được xem, không được chấm điểm/sửa
  const canInteract = role !== "LEAD" && role !== "HR";

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [internStatusFilter, setInternStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [planOptions, setPlanOptions] = useState([]);
  const [courseOrder, setCourseOrder] = useState([]);
// ⭐ BỔ SUNG: Khai báo Ref cho container cuộn
    const scrollContainerRef = useRef(null);
  // --- STATE MODAL ---
  const [editingTraining, setEditingTraining] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/trainings");
      setTrainings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải danh sách đào tạo:", e);
      setError("Không tải được danh sách đào tạo");
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get("/recruitment-plans/approved");
      setPlanOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải kế hoạch tuyển dụng:", e);
      setPlanOptions([]);
    }
  };

  const normalizeCourseOrder = (courses = []) =>
    courses
      .map((course, idx) => ({
        ...course,
        displayOrder:
          course?.displayOrder ??
          course?.orderIndex ??
          course?.sortOrder ??
          course?.order ??
          course?.position ??
          idx + 1,
      }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const fetchCourseOrder = async () => {
    try {
      const res = await api.get("/courses");
      setCourseOrder(
        normalizeCourseOrder(Array.isArray(res.data) ? res.data : [])
      );
    } catch (e) {
      console.error("Lỗi tải danh sách môn học:", e);
      setCourseOrder([]);
    }
  };

  useEffect(() => {
    fetchTrainings();
    fetchPlans();
    fetchCourseOrder();
  }, []);

// ⭐ FIX CUỘN NGANG: Đặt LOGIC CUỘN CHUỘT DỌC TẠI CẤP CAO NHẤT ⭐
useEffect(() => {
    // 1. Tìm phần tử cuộn ngang. Dùng querySelector vì ref có thể chưa sẵn sàng ngay.
    const scrollContainer = document.querySelector('.training-table-scroll');

    if (scrollContainer) {
        const handleWheel = (e) => {
            // Chỉ xử lý nếu có cuộn dọc (e.deltaY)
            if (e.deltaY !== 0) {
                
                // Ngăn chặn cuộn dọc trang mặc định
                e.preventDefault(); 
                
                // Dịch chuyển cuộn ngang (scrollLeft) bằng lượng cuộn dọc (deltaY)
                // Hệ số 3.0 sẽ làm cuộn nhanh và mượt hơn
                scrollContainer.scrollLeft += e.deltaY * 3.5; 
            }
        };

        // 2. Thêm trình lắng nghe sự kiện wheel
        // Dùng { passive: false } để đảm bảo e.preventDefault() hoạt động hiệu quả
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

        // 3. Xóa trình lắng nghe khi component unmount
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel, { passive: false });
        };
    }
}, []); // Dependency rỗng (chỉ chạy một lần)
  useEffect(() => {
    const planId = searchParams.get("planId");
    const planName = searchParams.get("planName");
    if (!planId) return;

    setPlanFilter(planId);
    setCurrentPage(1);

    setPlanOptions((prev) => {
      const exists = prev.some(
        (plan) => String(plan.id ?? plan.planId) === planId
      );
      if (exists) return prev;

      const fallbackName = planName || `Kế hoạch #${planId}`;
      const newPlan = {
        id: Number(planId) || planId,
        planId: Number(planId) || planId,
        name: fallbackName,
        planName: fallbackName,
      };
      return [newPlan, ...prev];
    });
  }, [searchParams]);

  const filteredTrainings = useMemo(
    () =>
      (trainings || []).filter((t) => {
        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
          
          const name = (
            t.traineeName ||
            t.fullName ||
            t.name ||
            ""
          ).toLowerCase();
          const email = (t.email || "").toLowerCase();
          const phone = (t.phoneNumber || t.phone || "").toLowerCase();

          if (
            !name.includes(keyword) &&
            !email.includes(keyword) &&
            !phone.includes(keyword)
          ) {
            return false;
          }
        }

        if (internStatusFilter) {
          const st = (t.internStatus || t.status || "").toLowerCase();
          if (!st.includes(internStatusFilter.toLowerCase())) return false;
        }

        if (planFilter) {
          const trainingPlanId =
            t.recruitmentPlanId ??
            t.planId ??
            t.recruitmentPlan?.id ??
            t.recruitmentPlan?.planId;
          if (trainingPlanId?.toString() !== planFilter) {
            return false;
          }
        }

        return true;
      }),
    [trainings, searchTerm, internStatusFilter, planFilter]
  );

  // giữ nguyên thứ tự API trả về
  const filteredSorted = useMemo(
    () => [...filteredTrainings],
    [filteredTrainings]
  );

  const orderScoresForDisplay = useCallback(
    (scores = []) => {
      if (!courseOrder.length) return scores || [];

      const orderedFromCourses = courseOrder.map((course) => {
        const match = scores.find(
          (s) =>
            (s.courseId &&
              course.courseId &&
              s.courseId === course.courseId) ||
            s.courseName === course.courseName
        );
        return match || { courseName: course.courseName, totalScore: null };
      });

      const remaining = (scores || []).filter(
        (s) =>
          !courseOrder.some(
            (course) =>
              (s.courseId &&
                course.courseId &&
                s.courseId === course.courseId) ||
              s.courseName === course.courseName
          )
      );

      return [...orderedFromCourses, ...remaining];
    },
    [courseOrder]
  );

  const totalPages = Math.ceil(filteredSorted.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTrainings = filteredSorted.slice(indexOfFirst, indexOfLast);

  const headerSubjects = courseOrder.length
    ? courseOrder
    : orderScoresForDisplay(currentTrainings[0]?.scores || []);

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

  // ✅ Hàm Xem: Luôn mở ở chế độ viewOnly
  const handleViewTraining = (training) => {
    setEditingTraining(training);
    setIsViewOnly(true);
    setIsEditModalOpen(true);
  };

  // ✅ Hàm Sửa: Kiểm tra quyền canInteract
  const handleEditTraining = (training) => {
    if (!canInteract) {
      // Nếu không có quyền mà cố gọi -> chuyển sang chế độ Xem
      handleViewTraining(training);
      return;
    }
    setEditingTraining(training);
    setIsViewOnly(false); // Cho phép sửa
    setIsEditModalOpen(true);
  };

  const handleSaveTraining = (updatedTraining) => {
    setTrainings((prevTrainings) =>
      prevTrainings.map((t) =>
        t.internId === updatedTraining.internId ? { ...t, ...updatedTraining } : t
      )
    );
    showToast("Cập nhật điểm thành công!");
    setIsEditModalOpen(false);
  };

  const formatDate = (value) => {
    if (!value) return "NA";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "NA";
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <Layout>
      {/* BREADCRUMB */}
      <div className="breadcrumb-container fade-slide">
        <div className="breadcrumb-left">
          <span className="breadcrumb-icon">📚</span>
          <span className="breadcrumb-item">Đào tạo</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">Quản lý đào tạo</span>
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

      {/* NỘI DUNG CHÍNH */}
      <div className="training-page fade-slide">
        <div className="title-row">
          <h2 className="page-title-small">Quản lý đào tạo</h2>

          <div className="filter-bar candidate-filter-bar">
            <div className="filter-item">
              <input
                type="text"
                className="filter-input"
                placeholder="Tìm theo tên..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="filter-icon">
                <FiSearch />
              </span>
            </div>

            <div className="filter-item">
              <select
                className="filter-select"
                value={internStatusFilter}
                onChange={(e) => {
                  setInternStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Đang thực tập">Đang thực tập</option>
                <option value="Đã hoàn thành">Đã hoàn thành</option>
                <option value="Đã dừng thực tập">Đã dừng thực tập</option>
              </select>
            </div>

            {/* Kế hoạch tuyển dụng */}
            <div className="filter-item">
              <select
                className="filter-select candidate-plan-select"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn kế hoạch tuyển dụng</option>
                {planOptions.map((plan) => (
                  <option
                    key={plan.id || plan.planId}
                    value={String(plan.id ?? plan.planId)}
                  >
                    {plan.name ?? plan.planName}
                  </option>
                ))}
              </select>
            </div>
            
          </div>
        </div>

        {/* TABLE 3 PHẦN */}
        <div className={`table-container table-fade ${isAnimating ? "fade-out" : "fade-in"}`}>
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="text-center text-error">{error}</p>
          ) : (
            <div className="training-table-container">
              {/* Cột trái cố định */}
              <table className="training-table-fixed">
                <thead>
                  <tr style={{ height: '52px' }}>
                    <th>STT</th>
                    <th>Họ tên</th>
                    <th>Bắt đầu</th>
                    <th>Số ngày TT</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainings.map((t, i) => (
                    <tr key={t.internId || i} style={{ height: '52px' }}>
                      <td>{indexOfFirst + i + 1}</td>
                      <td>{t.traineeName || t.fullName || "NA"}</td>
                      <td>{formatDate(t.startDate || t.beginDate || t.trainingStartDate)}</td>
                      <td>{t.trainingDays ?? t.soNgayThucTap ?? t.soNgayTT ?? "NA"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Scroll ngang môn */}
             <div 
    className="training-table-scroll"
    ref={scrollContainerRef} // ⭐ GÁN REF VÀO ĐÂY
>
                <table>
                  <thead>
                    <tr style={{ height: '52px' }}>
                      {headerSubjects.map((s, i) => ( // ✅ SỬA: Dùng headerSubjects đã sắp xếp
                        <th key={s.courseId || s.courseName || i}>
                          {s.courseName || "Môn học"}
                        </th>
                      ))}
                      {headerSubjects.length === 0 && (
                        <th>Chưa có môn</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTrainings.map((t, i) => (
                      <tr key={t.internId || i} style={{ height: '52px' }}>
                        {/* ✅ SỬA: Áp dụng hàm sắp xếp cho scores của mỗi TS */}
                        {orderScoresForDisplay(t.scores).map((s, j) => (
                          <td key={j}>
                            {s.totalScore != null ? Number(s.totalScore).toFixed(2) : "NA"}
                          </td>
                        ))}
                        {(t.scores?.length ?? 0) === 0 && (headerSubjects.length === 0) && <td>NA</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cột phải cố định */}
              <table className="training-table-fixed training-table-fixed-right">
                <thead>
                  <tr style={{ height: '52px' }}>
                    <th>Tổng kết</th>
                    <th>Đánh giá team</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainings.map((t, i) => (
                    <tr key={t.internId || i} style={{ height: '52px' }}>
                      <td>{t.summaryResult != null ? Number(t.summaryResult).toFixed(2) : "NA"}</td>
                      <td>{t.teamReview != null ? Number(t.teamReview).toFixed(1) : "NA"}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(t.internStatus)}`}>
                          {getStatusLabel(t.internStatus)}
                        </span>
                      </td>
                      <td>
                        <ActionButtons
                          onView={() => handleViewTraining(t)}
                          onEdit={() => handleEditTraining(t)}
                          canEdit={t.internStatus !== "Đã dừng thực tập" && t.internStatus !== "Đã hoàn thành"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredSorted.length > 0 && (
          <div className="pagination-bar">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <div className="mini-pagination">
              <label className="mini-pagination-label">Hiển thị:</label>
              <select value={itemsPerPage} onChange={handleChangeItemsPerPage} className="mini-pagination-select">
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHỈNH SỬA ĐIỂM */}
      {isEditModalOpen && editingTraining && (
        <EditTrainingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          trainingData={editingTraining}
          onSave={handleSaveTraining}
          isViewOnly={isViewOnly} // ✅ Truyền prop này để modal biết khóa ô input/nút lưu
          courseOrder={courseOrder}
        />
      )}

      {toast && (
        <div
          className={`toast-container ${toast.type === "success" ? "toast-success" : "toast-error"
            }`}
          role="status"
        >
          {toast.msg}
        </div>
      )}

      {/* 🔹 Trợ lý AI – bong bóng góc trái dưới */}
      <AIAssistantBubble trainings={trainings} planOptions={planOptions} />
    </Layout>
  );
}