// src/components/AddCandidateModal.jsx
import React, { useState, useEffect } from "react";
import { BaseModal, ModalFooter } from "./Modal";
import Input from "./Form/Input";
import api from "../services/api";

export default function AddCandidateModal({
  isOpen,
  onClose,
  onSuccess,
  planOptions = [],
}) {
  // --- State cho Form ---
  const initialState = {
    fullName: "",
    email: "",
    phoneNumber: "",
    cvLink: "",
    interviewDate: "",
    planId: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // Thêm toast giống EditTrainingModal

  // Toast helper
  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => setToast(null), 3500);
  };

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setErrors({});
      setApiError(null);
      setToast(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // --- Validate Form (Client-side) ---
  const validateForm = () => {
    const newErrors = {};
    const { fullName, email, phoneNumber, interviewDate, planId, cvLink } = formData;

    if (!fullName.trim()) newErrors.fullName = "Họ và tên không được để trống.";
    if (!email.trim()) newErrors.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email không đúng định dạng.";

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber))
      newErrors.phoneNumber = "SĐT phải là 10 chữ số bắt đầu bằng 0.";

    if (!interviewDate) newErrors.interviewDate = "Thời gian hẹn phỏng vấn không được để trống.";
    else {
      const selectedTime = new Date(interviewDate).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now)
        newErrors.interviewDate = "Thời gian hẹn phỏng vấn phải ở trong tương lai.";
    }

    if (!planId) newErrors.planId = "Kế hoạch tuyển dụng không được để trống.";

    if (!cvLink.trim()) newErrors.cvLink = "Link CV không được để trống.";
    else {
      const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
      if (!urlRegex.test(cvLink))
        newErrors.cvLink = "Link CV phải bắt đầu bằng http:// hoặc https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Xử lý Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        planId: formData.planId ? Number(formData.planId) : null,
      };

      const response = await api.post("/candidates/create", payload);
      onSuccess(response.data);
      showToast("Thêm ứng viên thành công!", "success");
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Lỗi khi tạo ứng viên";
      setApiError(msg);
      showToast(msg, "error");
      console.error("Lỗi khi tạo ứng viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const normalizePlan = (raw) => {
    const id = raw.id ?? raw.recruitmentPlanId ?? raw.planId ?? null;
    const name = raw.name ?? raw.planName ?? raw.title ?? "Kế hoạch không tên";
    return { id, name };
  };

  // Không render nếu không mở
  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        title="Thông tin ứng viên"
        onClose={onClose}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {apiError && <div className="modal-alert alert-error">{apiError}</div>}

          <div className="modal-form-grid">
            {/* Cột 1 */}
            <div className="modal-form-group">
              <label className="modal-form-label">Họ và tên ứng viên *</label>
              <input
                className={`modal-form-input ${errors.fullName ? "error" : ""}`}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên ứng viên..."
                required
              />
              {errors.fullName && <span className="modal-error-message">{errors.fullName}</span>}
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Email *</label>
              <input
                className={`modal-form-input ${errors.email ? "error" : ""}`}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email ứng viên..."
                required
              />
              {errors.email && <span className="modal-error-message">{errors.email}</span>}
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Số điện thoại *</label>
              <input
                className={`modal-form-input ${errors.phoneNumber ? "error" : ""}`}
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Nhập SĐT"
                required
              />
              {errors.phoneNumber && <span className="modal-error-message">{errors.phoneNumber}</span>}
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Link CV *</label>
              <input
                className={`modal-form-input ${errors.cvLink ? "error" : ""}`}
                name="cvLink"
                value={formData.cvLink}
                onChange={handleChange}
                placeholder="Link CV (Google Drive, TopCV...)"
                required
              />
              {errors.cvLink && <span className="modal-error-message">{errors.cvLink}</span>}
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Thời gian hẹn phỏng vấn *</label>
              <input
                className={`modal-form-input ${errors.interviewDate ? "error" : ""}`}
                name="interviewDate"
                type="datetime-local"
                value={formData.interviewDate}
                onChange={handleChange}
                required
              />
              {errors.interviewDate && <span className="modal-error-message">{errors.interviewDate}</span>}
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Kế hoạch tuyển dụng *</label>
              <select
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className={`modal-form-select ${errors.planId ? "error" : ""}`}
                required
              >
                <option value="">— Chọn kế hoạch đã duyệt —</option>
                {planOptions.map((raw) => {
                  const plan = normalizePlan(raw);
                  if (!plan.id) return null;
                  return (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  );
                })}
              </select>
              {errors.planId && <span className="modal-error-message">{errors.planId}</span>}
            </div>
          </div>

          <ModalFooter
            secondaryAction={{
              label: "Hủy",
              onClick: onClose,
              disabled: loading
            }}
            primaryAction={{
              label: loading ? "Đang thêm..." : "Thêm",
              onClick: handleSubmit,
              loading: loading,
              type: "submit"
            }}
          />
        </form>
      </BaseModal>

      {/* Toast notification */}
      {toast && (
        <div className={`modal-alert ${toast.type === "success" ? "alert-success" : "alert-error"}`} 
             style={{ 
               position: "fixed", 
               top: "20px", 
               right: "20px", 
               zIndex: 10000,
               minWidth: "300px"
             }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}