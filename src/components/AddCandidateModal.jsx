// src/components/AddCandidateModal.jsx
import React, { useState, useEffect } from "react";
import Input from "./Form/Input"; // Dùng lại Input component có sẵn
import api from "../services/api"; // Dùng instance axios chung
import "../styles/AddCandidateModal.css"; // Dùng CSS mới

/**
 * Props:
 * - isOpen (boolean): Hiển thị modal
 * - onClose (function): Hàm đóng modal
 * - onSuccess (function): Hàm callback khi tạo thành công, trả về (newCandidate)
 * - planOptions (Array): Danh sách plan đã duyệt
 *     + Có thể là dạng { id, name }
 *     + Hoặc dạng { recruitmentPlanId, planName }
 */
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

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setErrors({});
      setApiError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Validate Form (Client-side) ---
  const validateForm = () => {
    const newErrors = {};
    const { fullName, email, phoneNumber, interviewDate, planId } = formData;

    // Full name
    if (!fullName.trim()) {
      newErrors.fullName = "Họ và tên không được để trống.";
    }

    // Email (để BE check định dạng kỹ hơn, ở FE check cơ bản)
    if (!email.trim()) {
      newErrors.email = "Email không được để trống.";
    }

    // 1. Validate SĐT (chuẩn VN 10 số, bắt đầu bằng 0)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "SĐT phải là 10 chữ số bắt đầu bằng 0.";
    }

    // 2. Validate Ngày phỏng vấn (phải ở tương lai)
    if (!interviewDate) {
      newErrors.interviewDate =
        "Thời gian hẹn phỏng vấn không được để trống.";
    } else {
      const selectedTime = new Date(interviewDate).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now) {
        newErrors.interviewDate =
          "Thời gian hẹn phỏng vấn phải ở trong tương lai.";
      }
    }

    // 3. Validate Plan
    if (!planId) {
      newErrors.planId = "Kế hoạch tuyển dụng không được để trống.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Xử lý Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Chuyển planId thành number cho chắc ăn
      const payload = {
        ...formData,
        planId: formData.planId ? Number(formData.planId) : null,
      };

      // BE API: POST /api/candidates/create
      const response = await api.post("/candidates/create", payload);

      // BE trả về CandidateListDto của ứng viên vừa tạo
      onSuccess(response.data);
      onClose(); // Tự động đóng
    } catch (err) {
      // Hiển thị lỗi từ BE (vd: email trùng, validation BE)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Lỗi khi tạo ứng viên";
      setApiError(msg);
      console.error("Lỗi khi tạo ứng viên:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm chuẩn hoá plan: hỗ trợ cả 2 kiểu field (id/name vs recruitmentPlanId/planName)
  const normalizePlan = (raw) => {
    const id =
      raw.id ??
      raw.recruitmentPlanId ??
      raw.planId ??
      null;

    const name =
      raw.name ??
      raw.planName ??
      raw.title ??
      "Kế hoạch không tên";

    return { id, name };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Nền mờ (dùng style của request.css/plan.css) */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Nội dung Modal */}
      <div
        className="modal-content"
        style={{ maxWidth: "700px" }}
        role="dialog"
      >
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Thông tin ứng viên</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="modal-body candidate-form-grid">
            {/* Lỗi API */}
            {apiError && <div className="api-error-box">{apiError}</div>}

            {/* Cột 1 */}
            <div className="form-column">
              <Input
                label="Họ và tên ứng viên *"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên ứng viên..."
                error={errors.fullName}
                required
              />
              <Input
                label="Số điện thoại *"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Nhập SĐT"
                error={errors.phoneNumber}
                required
              />
              <Input
                label="Thời gian hẹn phỏng vấn *"
                name="interviewDate"
                type="datetime-local"
                value={formData.interviewDate}
                onChange={handleChange}
                error={errors.interviewDate}
                required
              />
            </div>

            {/* Cột 2 */}
            <div className="form-column">
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email ứng viên..."
                error={errors.email}
                required
              />
              <Input
                label="Link CV"
                name="cvLink"
                value={formData.cvLink}
                onChange={handleChange}
                placeholder="Link CV (Google Drive, TopCV...)"
                error={errors.cvLink}
              />
              <div className="form-group">
                <label>Kế hoạch tuyển dụng *</label>
                <select
                  name="planId"
                  value={formData.planId}
                  onChange={handleChange}
                  className={`input-style ${
                    errors.planId ? "input-error" : ""
                  }`}
                  required
                >
                  <option value="">— Chọn kế hoạch đã duyệt —</option>
                  {planOptions.map((raw) => {
                    const plan = normalizePlan(raw);
                    if (!plan.id) return null; // tránh option rác
                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    );
                  })}
                </select>
                {errors.planId && (
                  <span className="error-message">{errors.planId}</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer justify-end">
            <button
              type="button"
              className="modal-btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="modal-btn btn-add-candidate"
              disabled={loading}
            >
              {loading ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
