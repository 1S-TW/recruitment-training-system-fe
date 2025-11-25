// src/components/AddCandidateModal.jsx
import React, { useState, useEffect } from "react";
import Input from "./Form/Input";
import api from "../services/api";
import "../styles/AddCandidateModal.css";

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
    
    // (Tuỳ chọn) Xóa lỗi ngay khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // --- Validate Form (Client-side) ---
  const validateForm = () => {
    const newErrors = {};
    const { fullName, email, phoneNumber, interviewDate, planId, cvLink } = formData;

    // 1. Full name
    if (!fullName.trim()) {
      newErrors.fullName = "Họ và tên không được để trống.";
    }

    // 2. Email
    if (!email.trim()) {
      newErrors.email = "Email không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không đúng định dạng.";
    }

    // 3. Validate SĐT (chuẩn VN 10 số, bắt đầu bằng 0)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "SĐT phải là 10 chữ số bắt đầu bằng 0.";
    }

    // 4. Validate Ngày phỏng vấn
    if (!interviewDate) {
      newErrors.interviewDate = "Thời gian hẹn phỏng vấn không được để trống.";
    } else {
      const selectedTime = new Date(interviewDate).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now) {
        newErrors.interviewDate = "Thời gian hẹn phỏng vấn phải ở trong tương lai.";
      }
    }

    // 5. Validate Plan
    if (!planId) {
      newErrors.planId = "Kế hoạch tuyển dụng không được để trống.";
    }

    // ============================================================
    // 6. Validate Link CV (MỚI CẬP NHẬT)
    // ============================================================
    if (!cvLink.trim()) {
      newErrors.cvLink = "Link CV không được để trống.";
    } else {
      // Cách 1: Dùng Regex đơn giản bắt buộc có http/https
      const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
      
      if (!urlRegex.test(cvLink)) {
        newErrors.cvLink = "Link CV phải bắt đầu bằng http:// hoặc https://";
      }
      
      // Cách 2: (Strict hơn) Dùng URL constructor của JS
      // try {
      //   new URL(cvLink);
      // } catch (_) {
      //   newErrors.cvLink = "Link CV không đúng định dạng URL.";
      // }
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
      const payload = {
        ...formData,
        planId: formData.planId ? Number(formData.planId) : null,
      };

      const response = await api.post("/candidates/create", payload);

      onSuccess(response.data);
      onClose();
    } catch (err) {
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

  const normalizePlan = (raw) => {
    const id = raw.id ?? raw.recruitmentPlanId ?? raw.planId ?? null;
    const name = raw.name ?? raw.planName ?? raw.title ?? "Kế hoạch không tên";
    return { id, name };
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className="modal-content"
        style={{ maxWidth: "700px" }}
        role="dialog"
      >
        <div className="modal-header">
          <h3 className="modal-title">Thông tin ứng viên</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body candidate-form-grid">
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
              
              {/* CẬP NHẬT: Thêm required và dấu * */}
              <Input
                label="Link CV *"
                name="cvLink"
                value={formData.cvLink}
                onChange={handleChange}
                placeholder="Link CV (Google Drive, TopCV...)"
                error={errors.cvLink}
                required
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
                    if (!plan.id) return null;
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