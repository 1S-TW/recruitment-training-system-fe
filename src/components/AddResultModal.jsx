// src/components/AddResultModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import Input from "./Form/Input";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext"; // ✅ 1. Import AuthContext
import "../styles/AddResultModal.css";

// Helper functions
const getPlanName = (candidate) => {
  if (!candidate) return "—";
  return candidate.recruitmentPlanName || "Không rõ kế hoạch";
};

const formatDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  try {
    if (isoString.length === 16 && isoString.indexOf("T") === 10) return isoString;
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

const initialState = {
  // Thông tin ứng viên
  fullName: "",
  email: "",
  phoneNumber: "",
  cvLink: "",
  interviewDate: "",

  // Kết quả
  attendedInterview: "NO",
  testScore: "",
  interviewScore: "",
  comment: "",
  finalResult: "Không đạt", // Mặc định là Không đạt
  candidateStatus: "Chưa có kết quả",
  note: "",
  internshipDate: "",
};

export default function AddResultModal({ isOpen, onClose, onSuccess, candidate }) {
  // ✅ 2. Lấy Role từ Context
  const { user } = useAuth();
  const role = user?.role;

  // ✅ 3. Định nghĩa quyền hạn
  // HR & Admin được sửa thông tin cá nhân
  const canEditInfo = role === "SUPER_ADMIN" || role === "HR";
  // QLDT & Admin được chấm điểm
  const canEditScore = role === "SUPER_ADMIN" || role === "QLDT";

  // ✅ 4. Lọc danh sách trạng thái theo Role
  const getAvailableStatuses = () => {
    const allStatuses = [
      "Chưa có kết quả",
      "Đã có kết quả",
      "Đã gửi mail cảm ơn",
      "Đã hẹn ngày thực tập",
      "Không nhận việc",
      "Đã nhận việc"
    ];

    if (role === "SUPER_ADMIN") return allStatuses;

    if (role === "QLDT") {
      return ["Đã có kết quả", "Đã nhận việc", "Không nhận việc"];
    }

    if (role === "HR") {
      return ["Chưa có kết quả", "Đã gửi mail cảm ơn", "Đã hẹn ngày thực tập"];
    }

    // Default fallback
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  // 1. HOOKS
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isFirstTime, setIsFirstTime] = useState(true);
  
  // --- LOGIC KHÓA FORM ---
  // Nếu trạng thái là "Đã nhận việc" -> KHÓA TOÀN BỘ (Read-only) bất kể quyền
  const isLockedByFinalStatus = candidate?.status === "Đã nhận việc";
  
  // Nếu không đến phỏng vấn -> Khóa nhập điểm
  const isLockedByAttendance = formData.attendedInterview === "NO";
  
  // Biến khóa dùng cho vùng chấm điểm (Kết hợp logic nghiệp vụ + Phân quyền)
  const isResultLocked = isLockedByFinalStatus || isLockedByAttendance || !canEditScore;

  // Biến khóa dùng cho vùng thông tin (Kết hợp logic nghiệp vụ + Phân quyền)
  const isInfoLocked = isLockedByFinalStatus || !canEditInfo;

  // --- NẠP DỮ LIỆU ---
  useEffect(() => {
    if (isOpen && candidate) {
      setErrors({});
      const baseData = {
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        phoneNumber: candidate.phoneNumber || candidate.phone || "",
        cvLink: candidate.cvLink || "",
        interviewDate: formatDateTimeLocal(candidate.interviewDate),
      };

      if (candidate.finalResult && candidate.finalResult !== "NA") {
        setIsFirstTime(false);
        setFormData({
          ...baseData,
          attendedInterview: candidate.attendedInterview || initialState.attendedInterview,
          testScore: candidate.testScore ?? "",
          interviewScore: candidate.interviewScore ?? "",
          comment: candidate.comment || "",
          finalResult: candidate.finalResult || initialState.finalResult,
          candidateStatus: candidate.status || "Đã có kết quả",
          note: candidate.note || "",
          internshipDate: "",
        });
      } else {
        setIsFirstTime(true);
        setFormData({
          ...initialState,
          ...baseData,
        });
      }
      setApiError(null);
    }
  }, [isOpen, candidate]);

  // --- VALIDATE FORM ---
  const validateForm = () => {
    const newErrors = {};
    const { fullName, email, phoneNumber, cvLink, interviewDate } = formData;

    if (!fullName.trim()) newErrors.fullName = "Họ và tên không được để trống.";
    
    if (!email.trim()) newErrors.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email không đúng định dạng.";

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneNumber.trim()) newErrors.phoneNumber = "SĐT không được để trống.";
    else if (!phoneRegex.test(phoneNumber)) newErrors.phoneNumber = "SĐT phải là 10 chữ số bắt đầu bằng 0.";

    if (!cvLink.trim()) newErrors.cvLink = "Link CV không được để trống.";
    else {
        const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
        if (!urlRegex.test(cvLink)) newErrors.cvLink = "Link CV phải bắt đầu bằng http:// hoặc https://";
    }

    if (!interviewDate) newErrors.interviewDate = "Thời gian hẹn phỏng vấn không được để trống.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- LOGIC HỖ TRỢ CHẤM ĐIỂM TỰ ĐỘNG (AUTO-GRADING) ---
  useEffect(() => {
    // Nếu form đang bị khóa cứng hoặc người dùng không có quyền sửa điểm thì không tự nhảy
    if (isLockedByFinalStatus || !canEditScore) return;

    // Chỉ chạy khi cả 2 ô điểm đều đã có dữ liệu
    if (formData.testScore !== "" && formData.interviewScore !== "") {
        const test = Number(formData.testScore);
        const interview = Number(formData.interviewScore);

        if (!isNaN(test) && !isNaN(interview)) {
             // Điều kiện ĐẠT: Test >= 70 VÀ Phỏng vấn >= 7
             if (test >= 70 && interview >= 7) {
                 setFormData((prev) => ({ ...prev, finalResult: "Đạt" }));
             } else {
                 // Ngược lại: Tự động nhảy về KHÔNG ĐẠT
                 setFormData((prev) => ({ ...prev, finalResult: "Không đạt" }));
             }
        }
    }
  }, [formData.testScore, formData.interviewScore, isLockedByFinalStatus, canEditScore]);

  // --- LOGIC KHI "KHÔNG" ĐẾN PHỎNG VẤN ---
  useEffect(() => {
    if (isLockedByAttendance && !isLockedByFinalStatus && canEditScore) {
      setFormData((prev) => ({
        ...prev,
        testScore: "",
        interviewScore: "",
        comment: "",
        finalResult: "Không đạt",
        candidateStatus: "Chưa có kết quả"
      }));
    }
  }, [isLockedByAttendance, isLockedByFinalStatus, canEditScore]);

  // --- CHECK ĐIỀU KIỆN TRẠNG THÁI ---
  const canSetResultStatus = useMemo(() => {
    return (
      (formData.testScore !== "" && formData.testScore !== null) &&
      (formData.interviewScore !== "" && formData.interviewScore !== null) &&
      (formData.finalResult === "Đạt" || formData.finalResult === "Không đạt")
    );
  }, [formData.testScore, formData.interviewScore, formData.finalResult]);

  // --- AUTO UPDATE STATUS ---
  useEffect(() => {
    if (isLockedByFinalStatus) return;

    // Chỉ tự động cập nhật nếu QLDT hoặc Admin (người chấm điểm) đang thao tác
    // HR không chấm điểm nên không cần auto-switch status này
    if (canEditScore) {
      if (canSetResultStatus) {
        if (isFirstTime && formData.candidateStatus === "Chưa có kết quả") {
          setFormData((prev) => ({ ...prev, candidateStatus: "Đã có kết quả" }));
        }
      } else {
        if (formData.candidateStatus === "Đã có kết quả") {
          setFormData((prev) => ({ ...prev, candidateStatus: "Chưa có kết quả" }));
        }
      }
    }
  }, [canSetResultStatus, isFirstTime, formData.candidateStatus, isLockedByFinalStatus, canEditScore]);

  if (!isOpen || !candidate) return null;

  // Handle Change chung
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const showInternshipDate = formData.candidateStatus === "Đã hẹn ngày thực tập";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    // QLDT không được sửa info -> không cần validate info quá chặt nếu họ chỉ chấm điểm
    // Tuy nhiên validateForm check empty, nếu field có sẵn data thì sẽ pass.
    if (!validateForm()) return;

    setLoading(true);
    const dto = { ...formData };

    try {
      const response = await api.put(
        `/candidates/${candidate.candidateId}/save-result`,
        dto
      );
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Có lỗi xảy ra khi lưu kết quả.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content" style={{ maxWidth: "700px" }} role="dialog">
        <div className="modal-header">
          <h3 className="modal-title">Thông tin & Kết quả ứng viên</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-scroll-form">
          <div className="modal-body">

            {/* --- Phần 1: Thông tin (Chỉ HR & Admin sửa) --- */}
            <h4 className="form-section-title">Thông tin ứng viên</h4>
            <div className="candidate-form-grid">
              <div className="form-column">
                <Input 
                    label="Họ và tên ứng viên *" 
                    name="fullName"
                    value={formData.fullName} 
                    onChange={handleChange}
                    disabled={isInfoLocked} // ✅ Áp dụng khóa
                    error={errors.fullName}
                />
                <Input 
                    label="Số điện thoại *" 
                    name="phoneNumber"
                    value={formData.phoneNumber} 
                    onChange={handleChange}
                    disabled={isInfoLocked} // ✅ Áp dụng khóa
                    error={errors.phoneNumber}
                />
                <Input 
                    label="Thời gian hẹn phỏng vấn *" 
                    name="interviewDate"
                    type="datetime-local" 
                    value={formData.interviewDate} 
                    onChange={handleChange}
                    disabled={isInfoLocked} // ✅ Áp dụng khóa
                    error={errors.interviewDate}
                />
              </div>
              <div className="form-column">
                <Input 
                    label="Email *" 
                    name="email"
                    value={formData.email} 
                    onChange={handleChange}
                    disabled={isInfoLocked} // ✅ Áp dụng khóa
                    error={errors.email}
                />
                <Input 
                    label="Link CV *" 
                    name="cvLink"
                    value={formData.cvLink} 
                    onChange={handleChange}
                    disabled={isInfoLocked} // ✅ Áp dụng khóa
                    error={errors.cvLink}
                />
                <Input label="Kế hoạch tuyển dụng" value={getPlanName(candidate)} readOnly />
              </div>
            </div>

            {/* --- Phần 2: Kết quả phỏng vấn (Chỉ QLDT & Admin sửa) --- */}
            <h4 className="form-section-title">Kết quả phỏng vấn</h4>
            {apiError && <div className="api-error-box">{apiError}</div>}

            <div className="candidate-form-grid-3">
              <div className="form-group">
                <label>Có đến phỏng vấn?</label>
                <select
                  name="attendedInterview"
                  value={formData.attendedInterview}
                  onChange={handleChange}
                  className="input-style"
                  disabled={isLockedByFinalStatus || !canEditScore} // ✅ Chỉ QLDT/Admin
                >
                  <option value="NO">Không</option>
                  <option value="YES">Có</option>
                </select>
              </div>

              <Input
                label="Điểm kiểm tra (0-100)"
                name="testScore"
                type="number"
                min="0" max="100" step="0.5"
                value={formData.testScore}
                onChange={handleChange}
                placeholder="0-100"
                disabled={isResultLocked} // ✅ Bao gồm quyền canEditScore
              />

              <Input
                label="Điểm PV trực tiếp (0-10)"
                name="interviewScore"
                type="number"
                min="0" max="10" step="0.5"
                value={formData.interviewScore}
                onChange={handleChange}
                placeholder="0-10"
                disabled={isResultLocked} // ✅ Bao gồm quyền canEditScore
              />
            </div>

            <div className="form-group full-width">
                <label>Nhận xét (nếu có)</label>
                <textarea 
                    name="comment" 
                    rows="4" 
                    value={formData.comment} 
                    onChange={handleChange} 
                    className="input-style"
                    disabled={isResultLocked} // ✅ Bao gồm quyền canEditScore
                    placeholder="Nhập nhận xét..."
                />
            </div>

            {/* --- Kết quả cuối cùng --- */}
            <div className="form-group full-width final-result-block">
              <label>Kết quả cuối cùng</label>
              <select
                name="finalResult"
                value={formData.finalResult}
                onChange={handleChange}
                className="input-style final-result-select"
                disabled={isResultLocked} // ✅ Bao gồm quyền canEditScore
              >
                <option value="Đạt" className="text-pass">Đạt</option>
                <option value="Không đạt" className="text-fail">Không đạt</option>
              </select>
            </div>

            {/* --- Phần 3: Trạng Thái (Option hiển thị theo Role) --- */}
            <h4 className="form-section-title">Trạng Thái</h4>
            <div className="candidate-form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>Cập nhật trạng thái</label>
                  <select
                    name="candidateStatus"
                    value={formData.candidateStatus}
                    onChange={handleChange}
                    className="input-style"
                    disabled={isLockedByFinalStatus} // Ai vào được modal đều sửa được status (trong phạm vi cho phép)
                  >
                    {/* ✅ Option riêng cho từng role */}
                    {availableStatuses.map(st => (
                      <option 
                        key={st} 
                        value={st}
                        // Disable logic riêng: Đã nhận việc phải Đạt; Đã có kết quả phải đủ điểm
                        disabled={
                          (st === "Đã nhận việc" && formData.finalResult === 'Không đạt') ||
                          (st === "Đã có kết quả" && !canSetResultStatus)
                        }
                      >
                        {st}
                      </option>
                    ))}

                    {/* ✅ Luôn hiển thị trạng thái hiện tại (nếu nó không nằm trong list cho phép của role) để tránh lỗi UI */}
                    {!availableStatuses.includes(formData.candidateStatus) && (
                       <option value={formData.candidateStatus} disabled>
                         {formData.candidateStatus} (Hiện tại)
                       </option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-column">
                <Input
                  label="Lưu ý"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  disabled={isLockedByFinalStatus}
                />
              </div>
            </div>

            {showInternshipDate && (
              <div className="form-group" style={{ maxWidth: "323px" }}>
                <Input
                  label="Chọn ngày thực tập *"
                  name="internshipDate"
                  type="date"
                  value={formData.internshipDate}
                  onChange={handleChange}
                  required
                  disabled={isLockedByFinalStatus}
                  error={errors.internshipDate}
                />
              </div>
            )}
          </div>

          <div className="modal-footer justify-end">
            <button type="button" className="modal-btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" className="modal-btn btn-save" disabled={loading || isLockedByFinalStatus}>
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}