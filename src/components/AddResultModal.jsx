// src/components/AddResultModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import Input from "./Form/Input";
import api from "../services/api";
import "../styles/AddResultModal.css";

// ... (Các hàm helper 'getPlanName', 'formatDateTimeLocal' giữ nguyên) ...
const getPlanName = (candidate) => {
  if (!candidate) return "—";
  return candidate.recruitmentPlanName || "Không rõ kế hoạch";
};
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  try {
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

// --- State rỗng ban đầu ---
const initialState = {
  attendedInterview: "NA",
  testScore: "",
  interviewScore: "",
  comment: "",
  finalResult: "NA",
  candidateStatus: "Chưa có kết quả",
  note: "",
  internshipDate: "",
};

export default function AddResultModal({ isOpen, onClose, onSuccess, candidate }) {
  
  // ✅ SỬA LỖI ESLINT:
  // 1. TẤT CẢ HOOKS PHẢI ĐƯỢC GỌI LÊN ĐẦU TIÊN
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isPassDisabled, setIsPassDisabled] = useState(false);

  // --- ❗️ SỬA LỖI LOGIC NẠP DỮ LIỆU CHỖ NÀY ---
  useEffect(() => {
    // Chỉ chạy logic NẾU modal mở VÀ có candidate
    if (isOpen && candidate) {
      
      // ✅ Sửa lỗi: Kiểm tra bằng 'finalResult' (từ DTO backend)
      // Nếu 'finalResult' có giá trị ("PASS" hoặc "FAIL"),
      // nghĩa là đã chấm điểm ít nhất 1 lần.
      if (candidate.finalResult) { 
          
          // Lần 2+ (Đã có kết quả)
          setIsFirstTime(false);
          setFormData({
              // Nạp dữ liệu từ DTO (candidate prop)
              attendedInterview: candidate.attendedInterview || "YES",
              testScore: candidate.testScore ?? "",
              interviewScore: candidate.interviewScore ?? "",
              comment: candidate.comment || "",
              finalResult: candidate.finalResult, // 👈 Nạp "PASS" hoặc "FAIL"
              candidateStatus: candidate.status || "Đã có kết quả",
              note: candidate.note || "",
              internshipDate: "", 
          });
      } else {
          // Lần 1 (finalResult là null)
          setIsFirstTime(true);
          setFormData({
              ...initialState,
              // Lần đầu, giữ lại status "Chưa có kết quả"
              candidateStatus: candidate.status || "Chưa có kết quả"
          });
      }
      setIsPassDisabled(false); // Reset check quota
      setApiError(null);
    }
  }, [isOpen, candidate]); // Phụ thuộc vào candidate prop

  // (Theo yêu cầu) Chỉ cho phép chọn "Đã có kết quả" khi điền đủ 4 trường
  const canSetResultStatus = useMemo(() => {
    return (
      formData.attendedInterview !== "NA" &&
      (formData.testScore !== "" && formData.testScore !== null) &&
      (formData.interviewScore !== "" && formData.interviewScore !== null) &&
      formData.finalResult !== "NA"
    );
  }, [
    formData.attendedInterview,
    formData.testScore,
    formData.interviewScore,
    formData.finalResult,
  ]);

  // (Theo yêu cầu) Tự động chuyển status nếu chưa đủ điều kiện
  useEffect(() => {
    // Chỉ chạy logic này khi đang chấm LẦN ĐẦU
    if (isFirstTime) {
      if (
        formData.candidateStatus === "Đã có kết quả" &&
        !canSetResultStatus
      ) {
        setFormData((prev) => ({ ...prev, candidateStatus: "Chưa có kết quả" }));
      }
    }
  }, [formData.candidateStatus, canSetResultStatus, isFirstTime]);


  // 2. "EARLY RETURN" PHẢI ĐẶT SAU KHI GỌI HẾT HOOKS
  if (!isOpen || !candidate) {
    return null;
  }

  // 3. LOGIC CÒN LẠI (phải đặt sau early return)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // (Theo yêu cầu) Hiển thị ô chọn ngày khi status là "Đã hẹn ngày thực tập"
  const showInternshipDate =
    formData.candidateStatus === "Đã hẹn ngày thực tập";
    
  // (Theo yêu cầu) Các trường điểm/kết quả sẽ bị khóa nếu KHÔNG PHẢI lần đầu
  const isReadOnly = !isFirstTime; 
  
  // ✅ SỬA LỖI LOGIC KHÓA
  // (Theo yêu cầu) Chỉ khóa nếu status *đã lưu* (từ prop) là "chết"
  const isStatusLocked = 
    (candidate.status === "Đã nhận việc" || 
     candidate.status === "Không nhận việc");

  // handleSubmit (Giữ nguyên)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setLoading(true);
    const dto = { ...formData };
    
    try {
      // Gọi PUT /api/candidates/{id}/save-result
      const response = await api.put(
        `/candidates/${candidate.candidateId}/save-result`,
        dto
      );
      onSuccess(response.data); // Trả về DTO MỚI NHẤT
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Lỗi khi lưu kết quả";
      setApiError(msg);
      
      if (msg.includes("đã đạt đủ số lượng")) {
        setIsPassDisabled(true);
      }
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="modal-scroll-form">
          <div className="modal-body">
            
            {/* --- Phần 1: Thông tin (Read-only) --- */}
            <h4 className="form-section-title">Thông tin</h4>
            <div className="candidate-form-grid">
              <div className="form-column">
                <Input
                  label="Họ và tên ứng viên *"
                  value={candidate.fullName}
                  readOnly
                />
                <Input
                  label="Số điện thoại *"
                  value={candidate.phoneNumber}
                  readOnly
                />
                <Input
                  label="Thời gian hẹn phỏng vấn *"
                  type="datetime-local"
                  value={formatDateTimeLocal(candidate.interviewDate)}
                  readOnly
                />
              </div>
              <div className="form-column">
                <Input label="Email *" value={candidate.email} readOnly />
                <Input
                  label="Link CV"
                  value={candidate.cvLink || "—"}
                  readOnly
                />
                <Input
                  label="Kế hoạch tuyển dụng"
                  value={getPlanName(candidate)}
                  readOnly
                />
              </div>
            </div>

            {/* --- Phần 2: Kết quả phỏng vấn --- */}
            <h4 className="form-section-title">Kết quả phỏng vấn</h4>
            {apiError && <div className="api-error-box">{apiError}</div>}
            <div className="candidate-form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>Có đến phỏng vấn?</label>
                  <select
                    name="attendedInterview"
                    value={formData.attendedInterview} // 👈 Đọc từ state
                    onChange={handleChange}
                    className="input-style"
                    disabled={isReadOnly} // ✅ KHÓA KHI LÀ LẦN 2+
                  >
                    <option value="NA">— Mặc định (NA) —</option>
                    <option value="YES">Có</option>
                    <option value="NO">Không</option>
                  </select>
                </div>
                <Input
                  label="Điểm kiểm tra (%)"
                  name="testScore"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.testScore} // 👈 Đọc từ state
                  onChange={handleChange}
                  placeholder="0-100"
                  disabled={isReadOnly} // ✅ KHÓA KHI LÀ LẦN 2+
                />
              </div>
              <div className="form-column">
                <Input
                  label="Điểm phỏng vấn trực tiếp"
                  name="interviewScore"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={formData.interviewScore} // 👈 Đọc từ state
                  onChange={handleChange}
                  placeholder="0-10"
                  disabled={isReadOnly} // ✅ KHÓA KHI LÀ LẦN 2+
                />
                <div className="form-group">
                  <label>Kết quả cuối cùng</label>
                  <select
                    name="finalResult"
                    value={formData.finalResult} // 👈 Đọc từ state
                    onChange={handleChange}
                    className="input-style"
                    disabled={isReadOnly} // ✅ KHÓA KHI LÀ LẦN 2+
                  >
                    <option value="NA">— Mặc định (NA) —</option>
                    
                    {/* (Theo yêu cầu) Ẩn PASS nếu hết quota */}
                    {(!isPassDisabled || formData.finalResult === 'PASS') && (
                        <option value="PASS" className="text-pass">
                            PASS
                        </option>
                    )}
                    
                    <option value="FAIL" className="text-fail">
                      FAIL
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <Input
              label="Nhận xét (nếu có)"
              name="comment"
              value={formData.comment} // 👈 Đọc từ state
              onChange={handleChange}
              placeholder="Nhập nhận xét của người phỏng vấn..."
              disabled={isReadOnly} // ✅ KHÓA KHI LÀ LẦN 2+
            />

            {/* --- Phần 3: Trạng Thái --- */}
            <h4 className="form-section-title">Trạng Thái</h4>
            <div className="candidate-form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>Cập nhật trạng thái</label>
                  <select
                    name="candidateStatus"
                    value={formData.candidateStatus} // 👈 Đọc từ state
                    onChange={handleChange}
                    className="input-style"
                    disabled={isStatusLocked} // ✅ SỬA: Dùng logic này
                    title={isStatusLocked ? "Không thể thay đổi trạng thái này" : ""}
                  >
                    <option value="Chưa có kết quả">Chưa có kết quả</option>
                    <option
                      value="Đã có kết quả"
                      disabled={!canSetResultStatus}
                      title={
                        canSetResultStatus
                          ? ""
                          : "Phải điền đủ 4 trường kết quả ở trên"
                      }
                    >
                      Đã có kết quả
                    </option>
                    <option value="Đã gửi mail cảm ơn">
                      Đã gửi mail cảm ơn
                    </option>
                    <option value="Đã hẹn ngày thực tập">
                      Đã hẹn ngày thực tập
                    </option>
                    <option value="Không nhận việc">Không nhận việc</option>
                    <option value="Đã nhận việc">Đã nhận việc</option>
                  </select>
                </div>
              </div>
              <div className="form-column">
                <Input
                  label="Lưu ý"
                  name="note"
                  value={formData.note} // 👈 Đọc từ state
                  onChange={handleChange}
                  placeholder="Nhập lưu ý (nếu có)..."
                  // (Lưu ý/Note LUÔN được phép sửa)
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
                  disabled={isStatusLocked} // ✅ SỬA: Dùng logic này
                />
              </div>
            )}
          </div>

          {/* Footer (Nút bấm) */}
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
              className="modal-btn btn-save"
              disabled={loading || isStatusLocked} // ✅ SỬA: Dùng logic này
            >
              {loading ? "Đang lưu..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}