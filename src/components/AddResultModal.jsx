// src/components/AddResultModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import Input from "./Form/Input";
import api from "../services/api";
import "../styles/AddResultModal.css";

// Helper functions (Giữ nguyên)
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

// --- State rỗng ban đầu với mặc định mới ---
const initialState = {
  attendedInterview: "NO", // NEW DEFAULT: KHÔNG
  testScore: "",
  interviewScore: "",
  comment: "",
  finalResult: "FAIL",     // NEW DEFAULT: FAIL
  candidateStatus: "Chưa có kết quả",
  note: "",
  internshipDate: "",
};

export default function AddResultModal({ isOpen, onClose, onSuccess, candidate }) {

  // 1. HOOKS
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isPassDisabled, setIsPassDisabled] = useState(false);

  // --- LOGIC: Khóa dựa trên trạng thái đã lưu: chỉ khóa khi đã "Đã nhận việc" ---
  const isLockedByFinalStatus = candidate?.status === "Đã nhận việc";

  // --- LOGIC: Khóa dựa trên việc không tham dự phỏng vấn ---
  const isLockedByAttendance = formData.attendedInterview === "NO";

  // --- LOGIC: Khóa tổng thể (khóa score/status) ---
  const isScoringAndStatusLocked = isLockedByFinalStatus || isLockedByAttendance;


  // --- CẬP NHẬT LOGIC NẠP DỮ LIỆU & GIỮ TRẠNG THÁI LẦN 2+ ---
  useEffect(() => {
    if (isOpen && candidate) {

      // Kiểm tra xem đã có kết quả (finalResult) chưa
      if (candidate.finalResult && candidate.finalResult !== "NA") {

        // Lần 2+: Nạp dữ liệu đã lưu
        setIsFirstTime(false);
        const loadedData = {
          // Dùng giá trị đã lưu, fallback về default nếu null (để tránh lỗi)
          attendedInterview: candidate.attendedInterview || initialState.attendedInterview,
          testScore: candidate.testScore ?? "",
          interviewScore: candidate.interviewScore ?? "",
          comment: candidate.comment || "",
          finalResult: candidate.finalResult || initialState.finalResult,
          candidateStatus: candidate.status || "Đã có kết quả",
          note: candidate.note || "",
          internshipDate: "",
        };
        setFormData(loadedData);
      } else {
        // Lần 1: Dùng mặc định mới
        setIsFirstTime(true);
        setFormData(initialState);
      }
      setIsPassDisabled(false);
      setApiError(null);
    }
  }, [isOpen, candidate]);

  // --- LOGIC AUTO-PASS VÀ AUTO-FAIL (Khi điểm thay đổi) ---
  useEffect(() => {
    // Không chạy logic Auto-PASS/FAIL nếu đang bị khóa cứng bởi trạng thái cuối cùng
    if (isLockedByFinalStatus) return;

    const test = Number(formData.testScore);
    const interview = Number(formData.interviewScore);

    // Yêu cầu: Điểm kiểm tra >= 70 VÀ Điểm phỏng vấn trực tiếp >= 7
    const isReadyToPass = !Number.isNaN(test) && !Number.isNaN(interview)
      && test >= 70 && interview >= 7;

    if (isReadyToPass) {
      // Auto-PASS nếu đạt (và chưa bị chặn bởi quota)
      if (formData.finalResult !== "PASS" && !isPassDisabled) {
        setFormData((prev) => ({ ...prev, finalResult: "PASS" }));
      }
    } else {
      // Auto-reset về FAIL nếu điểm không đạt, nhưng chỉ khi đang là PASS
      if (formData.finalResult === "PASS") {
        setFormData((prev) => ({ ...prev, finalResult: "FAIL" }));
      }
    }
  }, [
    formData.testScore,
    formData.interviewScore,
    formData.finalResult,
    isLockedByFinalStatus,
    isPassDisabled
  ]);

  // --- LOGIC KHI CÓ ĐẾN PHỎNG VẤN LÀ "KHÔNG" (Khóa điểm, reset giá trị) ---
  useEffect(() => {
    if (isLockedByAttendance) {
      // Nếu chọn KHÔNG tham dự, reset các trường điểm và status
      setFormData((prev) => ({
        ...prev,
        testScore: "",
        interviewScore: "",
        comment: "",
        finalResult: "FAIL",
        candidateStatus: "Chưa có kết quả"
      }));
    }
  }, [isLockedByAttendance]);

  // --- LOGIC KIỂM TRA ĐỦ ĐIỀU KIỆN ĐỂ CHỌN "ĐÃ CÓ KẾT QUẢ" ---
  const canSetResultStatus = useMemo(() => {
    // Cần có điểm test, điểm PV và final result (PASS/FAIL)
    return (
      (formData.testScore !== "" && formData.testScore !== null) &&
      (formData.interviewScore !== "" && formData.interviewScore !== null) &&
      (formData.finalResult === "PASS" || formData.finalResult === "FAIL")
    );
  }, [
    formData.testScore,
    formData.interviewScore,
    formData.finalResult,
  ]);

  // --- LOGIC TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI ---
  useEffect(() => {
    // Nếu đủ điều kiện, tự động chuyển sang "Đã có kết quả" (nếu là lần đầu)
    if (canSetResultStatus) {
      // Chỉ tự động chuyển nếu trạng thái hiện tại chưa phải là các trạng thái "tiến xa" hơn
      if (isFirstTime && formData.candidateStatus === "Chưa có kết quả") {
        setFormData((prev) => ({ ...prev, candidateStatus: "Đã có kết quả" }));
      }
    } else {
      // Nếu không đủ điều kiện (thiếu điểm/kết quả), bắt buộc phải quay về "Chưa có kết quả"
      if (formData.candidateStatus === "Đã có kết quả") {
        setFormData((prev) => ({ ...prev, candidateStatus: "Chưa có kết quả" }));
      }
    }
  }, [canSetResultStatus, isFirstTime, formData.candidateStatus]); // ✅ Đã thêm dependency

  // 2. "EARLY RETURN"
  if (!isOpen || !candidate) {
    return null;
  }

  // 3. LOGIC CÒN LẠI
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Chặn sửa trường ngoại trừ Note nếu đang bị khóa cứng
    if (isLockedByFinalStatus && name !== "note") return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showInternshipDate =
    formData.candidateStatus === "Đã hẹn ngày thực tập";

  const isSubmitDisabled = loading || isLockedByFinalStatus;


  // handleSubmit (giữ nguyên logic API)
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
      onSuccess(response.data);
      onClose();
    } catch (err) {
      console.error("Error details:", err); // Log để debug nếu cần

      // ✅ SỬA: Ưu tiên lấy message từ backend trả về
      // Backend (GlobalExceptionHandler) giờ sẽ trả về { "message": "Nội dung lỗi cụ thể..." }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Có lỗi xảy ra khi lưu kết quả.";

      setApiError(msg);

      // Logic check quota (backend trả message chứa chuỗi này)
      if (msg && msg.includes("đã đạt đủ số lượng")) {
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
                <Input label="Họ và tên ứng viên *" value={candidate.fullName} readOnly />
                <Input label="Số điện thoại *" value={candidate.phoneNumber} readOnly />
                <Input label="Thời gian hẹn phỏng vấn *" type="datetime-local" value={formatDateTimeLocal(candidate.interviewDate)} readOnly />
              </div>
              <div className="form-column">
                <Input label="Email *" value={candidate.email} readOnly />
                <Input label="Link CV" value={candidate.cvLink || "—"} readOnly />
                <Input label="Kế hoạch tuyển dụng" value={getPlanName(candidate)} readOnly />
              </div>
            </div>

            {/* --- Phần 2: Kết quả phỏng vấn --- */}
            <h4 className="form-section-title">Kết quả phỏng vấn</h4>
            {apiError && <div className="api-error-box">{apiError}</div>}

            {/* NEW ROW 1: 3 Cột - Attended, Test Score, Interview Score */}
            <div className="candidate-form-grid-3">

              {/* 1. Có đến phỏng vấn (Chỉ khóa nếu đã là Đã nhận việc) */}
              <div className="form-group">
                <label>Có đến phỏng vấn?</label>
                <select
                  name="attendedInterview"
                  value={formData.attendedInterview}
                  onChange={handleChange}
                  className="input-style"
                  disabled={isLockedByFinalStatus}
                >
                  <option value="NO">Không</option>
                  <option value="YES">Có</option>
                </select>
              </div>

              {/* 2. Điểm kiểm tra */}
              <Input
                label="Điểm kiểm tra (%)"
                name="testScore"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.testScore}
                onChange={handleChange}
                placeholder="0-100"
                disabled={isScoringAndStatusLocked}
              />

              {/* 3. Điểm phỏng vấn trực tiếp */}
              <Input
                label="Điểm phỏng vấn trực tiếp"
                name="interviewScore"
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={formData.interviewScore}
                onChange={handleChange}
                placeholder="0-10"
                disabled={isScoringAndStatusLocked}
              />
            </div>

            {/* NEW ROW 2: Nhận xét (full-width, textarea) */}
            <div className="form-group full-width">
              <label>Nhận xét (nếu có)</label>
              <textarea
                name="comment"
                rows="4"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Nhập nhận xét của người phỏng vấn..."
                className="input-style"
                disabled={isLockedByFinalStatus}
              />
            </div>

            {/* NEW ROW 3: Kết quả cuối cùng (Full-width, Centered, Nổi bật) */}
            <div className="form-group full-width final-result-block">
              <label>Kết quả cuối cùng</label>
              <select
                name="finalResult"
                value={formData.finalResult}
                onChange={handleChange}
                className="input-style final-result-select"
                disabled={isScoringAndStatusLocked}
              >
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

            {/* --- Phần 3: Trạng Thái --- */}
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
                    disabled={isScoringAndStatusLocked}
                    title={isScoringAndStatusLocked ? "Chỉ được sửa khi Có đến PV và chưa là Đã nhận việc" : ""}
                  >
                    <option value="Chưa có kết quả">Chưa có kết quả</option>
                    <option
                      value="Đã có kết quả"
                      disabled={isScoringAndStatusLocked || !canSetResultStatus}
                      title={
                        isScoringAndStatusLocked ? "Đang bị khóa" : (canSetResultStatus ? "" : "Phải điền đủ Điểm Test, Điểm PV và Final Result")
                      }
                    >
                      Đã có kết quả
                    </option>
                    <option
                      value="Đã gửi mail cảm ơn"
                      disabled={isScoringAndStatusLocked}
                    >
                      Đã gửi mail cảm ơn
                    </option>
                    <option
                      value="Đã hẹn ngày thực tập"
                      disabled={isScoringAndStatusLocked}
                    >
                      Đã hẹn ngày thực tập
                    </option>
                    <option
                      value="Không nhận việc"
                      disabled={isScoringAndStatusLocked}
                    >
                      Không nhận việc
                    </option>
                    {/* Logic chặn FAIL -> Đã nhận việc */}
                    <option
                      value="Đã nhận việc"
                      disabled={isScoringAndStatusLocked || formData.finalResult === 'FAIL'}
                      title={formData.finalResult === 'FAIL' ? "Kết quả cuối cùng là FAIL, không thể chọn Đã nhận việc" : undefined}
                    >
                      Đã nhận việc
                    </option>
                  </select>
                </div>
              </div>
              <div className="form-column">
                <Input
                  label="Lưu ý"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Nhập lưu ý (nếu có)..."
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
              disabled={isSubmitDisabled}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}