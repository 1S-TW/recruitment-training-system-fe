// === EditTrainingModal.jsx ===
import React, { useState, useEffect } from "react";
import "../styles/EditTrainingModal.css";
import axios from "axios";
import api from "../services/api"; // SỬ DỤNG api ĐÃ CẤU HÌNH

export default function EditTrainingModal({
  isOpen,
  onClose,
  trainingData,
  onSave, // callback để cập nhật FE
}) {
  const [scores, setScores] = useState([]);
  const [overallScore, setOverallScore] = useState("NA");
  const [teamEvaluation, setTeamEvaluation] = useState("");
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (trainingData) {
      setStopped(trainingData.internStatus === "Đã dừng thực tập");

      const initScores = (trainingData.scores || []).map((s) => ({
      courseName: s.courseName,
      theory: s.theoryScore != null ? s.theoryScore : "",
      attitude: s.attitudeScore != null ? s.attitudeScore : "",
      practice: s.practiceScore != null ? s.practiceScore : "",
      totalScore: s.totalScore,
    }));

      setScores(initScores);
      calculateOverall(initScores);
      setTeamEvaluation(trainingData.teamReview || "");
    }
  }, [trainingData]);

  const isValid = (v) => v !== "" && !isNaN(v) && v >= 0 && v <= 10;

  const renderIcon = (value) => {
    if (value === "NA") return "NA";
    if (value >= 7)
      return (
        <svg width="18" height="18" fill="#22c55e">
          <path d="M6.173 14.727L2.1 10.654l1.4-1.4 2.673 2.673 6.727-6.727 1.4 1.4z" />
        </svg>
      );
    return (
      <svg width="18" height="18" fill="#ef4444">
        <path d="M4.222 3l5.364 5.364L14.95 3l1.414 1.414-5.364 5.364 5.364 5.364-1.414 1.414-5.364-5.364L4.222 15.55 2.808 14.136l5.364-5.364L2.808 3z" />
      </svg>
    );
  };

  const calculateOverall = (list) => {
    const totals = list.map((s) => {
      if (isValid(s.theory) && isValid(s.attitude) && isValid(s.practice)) {
        return ((Number(s.theory) + Number(s.attitude) + Number(s.practice)) / 3).toFixed(1);
      }
      return "NA";
    });

    if (totals.includes("NA")) {
      setOverallScore("NA");
    } else {
      const avg = (totals.reduce((a, b) => a + Number(b), 0) / totals.length).toFixed(1);
      setOverallScore(avg);
    }
  };

  const handleScoreChange = (index, key, value) => {
    if (stopped) return;
    const newScores = [...scores];
    newScores[index][key] = value;
    setScores(newScores);
    calculateOverall(newScores);
  };

  // Thêm hàm dừng thực tập
  const handleStopInternship = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn DỪNG thực tập của thực tập sinh này?\nHành động này KHÔNG THỂ HOÀN TÁC!")) {
      return;
    }

    try {
      const response = await api.put(`/trainings/${trainingData.internId}/stop`);
      onSave(response.data);
      onClose();
      alert("Đã dừng thực tập thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi dừng thực tập!");
    }
  };

  // Sửa useEffect để hiển thị trạng thái đúng
  useEffect(() => {
    if (trainingData) {
      const status = trainingData.internStatus || "Đang thực tập";
      setStopped(status === "Đã dừng thực tập");

      const initScores = (trainingData.scores || []).map((s) => ({
        courseName: s.courseName,
        theory: s.theoryScore != null ? s.theoryScore : "",
        attitude: s.attitudeScore != null ? s.attitudeScore : "",
        practice: s.practiceScore != null ? s.practiceScore : "",
        totalScore: s.totalScore,
      }));

      setScores(initScores);
      setOverallScore(
        trainingData.summaryResult != null 
          ? Number(trainingData.summaryResult).toFixed(2)
          : "NA"
      );
      setTeamEvaluation(
        trainingData.teamReview != null ? String(trainingData.teamReview) : ""
      );
    }
  }, [trainingData]);

  // --- gửi payload lên API backend ---
const handleSave = async () => {
  const processedScores = scores.map((s) => ({
    courseName: s.courseName,
    theoryScore: s.theory !== "" ? Number(s.theory) : null,
    practiceScore: s.practice !== "" ? Number(s.practice) : null,
    attitudeScore: s.attitude !== "" ? Number(s.attitude) : null,
    // ← KHÔNG GỬI totalScore → backend tự tính!
  }));

  // Tính overall score để gửi
  const validScores = processedScores.filter(s =>
    s.theoryScore !== null && s.practiceScore !== null && s.attitudeScore !== null
  );

  const overall = validScores.length > 0
    ? (validScores.reduce((sum, s) =>
        sum + (s.theoryScore + s.practiceScore + s.attitudeScore) / 3, 0) / validScores.length
      ).toFixed(2)
    : null;

  // Xác định kết quả thực tập
  const hasIncomplete = processedScores.some(s =>
    s.theoryScore === null || s.practiceScore === null || s.attitudeScore === null
  );
  const hasFailSubject = validScores.some(s =>
    (s.theoryScore + s.practiceScore + s.attitudeScore) / 3 < 7
  );

  const internshipResult = hasIncomplete
    ? "NA"
    : (overall >= 7 && !hasFailSubject ? "PASS" : "FAIL");

  // PAYLOAD ĐÚNG 100% THEO BACKEND
  const payload = {
    scores: processedScores,
    summaryResult: overall !== null ? Number(overall) : null,
    teamReview: teamEvaluation !== "" && !isNaN(teamEvaluation) ? Number(teamEvaluation) : null,
    internshipResult: internshipResult
  };

  console.log("Gửi payload:", payload); // ← KIỂM TRA TRONG CONSOLE

  try {
    // DÙNG api ĐÃ CẤU HÌNH (tự thêm token + withCredentials)
    const response = await api.put(
      `/trainings/${trainingData.internId}/scores`,
      payload
    );

    // Cập nhật ngay dữ liệu trên FE
    onSave(response.data);
    onClose();
    alert("Lưu điểm thành công!");
  } catch (err) {
    console.error("Lỗi lưu điểm:", err.response?.data || err.message);
    alert("Lưu thất bại! Kiểm tra console (F12)");
  }
};


  if (!isOpen) return null;

   return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-close" onClick={onClose}>✕</div>

        <h2>Kết quả học tập</h2>

        <div className="training-info">
          <div>
            Họ và tên: {trainingData?.traineeName || trainingData?.fullName || trainingData?.name || "NA"}
          </div>

          <div>
            Ngày bắt đầu: {trainingData?.startDate} |Số ngày thực tập: {trainingData?.trainingDays ?? trainingData?.soNgayThucTap ?? trainingData?.soNgayTT ?? "NA"}
          </div>
          <div>Ngày kết thúc: {trainingData?.endDate || "Chưa kết thúc"}</div>
          {stopped && (
            <div style={{ color: "red", fontWeight: 600 }}>
              • ĐÃ DỪNG THỰC TẬP — KHÔNG THỂ CHỈNH SỬA
            </div>
          )}
        </div>

        {/* SCORE TABLE */}
        <div className="scores-table">
          <div className="scores-header">
            <div className="subject-cell">Môn học</div>
            <div className="subject-cell">Lý thuyết</div>
            <div className="subject-cell">Thái độ</div>
            <div className="subject-cell">Thực hành</div>
            <div className="subject-cell">Tổng</div>
          </div>

          {scores.map((s, i) => {
            const valid3 =
              isValid(s.theory) && isValid(s.attitude) && isValid(s.practice);
            const total = valid3
              ? (
                  (Number(s.theory) + Number(s.attitude) + Number(s.practice)) /
                  3
                ).toFixed(1)
              : "NA";

            return (
              <div key={i} className="scores-row">
                <div className="subject-cell">{s.courseName}</div>

                  {['theory','attitude','practice'].map((key) => (
                    <div className="subject-cell" key={key}>
                      <input
                        disabled={stopped}
                        type="text"
                        value={s[key]}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Nếu bỏ trống thì ok
                          if (value === "") {
                            handleScoreChange(i, key, "");
                            return;
                          }
                          // Chỉ cho phép số và dấu chấm
                          if (/^\d*\.?\d*$/.test(value)) {
                            let num = parseFloat(value);
                            if (!isNaN(num)) {
                              // Giới hạn 0 → 10
                              if (num > 10) num = 10;
                              if (num < 0) num = 0;
                              handleScoreChange(i, key, num);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Chặn ký tự ngoài số, dấu ., backspace, delete, tab, mũi tên
                          if (
                            !(
                              (e.key >= "0" && e.key <= "9") ||
                              e.key === "." ||
                              e.key === "Backspace" ||
                              e.key === "Delete" ||
                              e.key === "ArrowLeft" ||
                              e.key === "ArrowRight" ||
                              e.key === "Tab"
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                        className="score-input"
                        style={{ width: "60px", padding: "4px", textAlign: "center", fontSize: "14px" }}
                      />
                    </div>
                  ))}


                <div className="subject-cell total-cell">
                  {total !== "NA" ? (
                    <div className="total-flex">
                      <span>{total}</span>
                      {renderIcon(Number(total))}
                    </div>
                  ) : (
                    "NA"
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* OVERALL */}
        <div className="overall-scores">
          <strong>
            Tổng kết: {overallScore !== "NA" ? (
              <span className="total-flex">
                <span>{overallScore}</span>
                {renderIcon(Number(overallScore))}
              </span>
            ) : (
              "NA"
            )}
          </strong>

          {(() => {
          // Lấy tổng điểm từng môn (null nếu thiếu)
          const subjectTotals = scores.map((s) => {
            if (isValid(s.theory) && isValid(s.attitude) && isValid(s.practice)) {
              return (
                (Number(s.theory) +
                  Number(s.attitude) +
                  Number(s.practice)) /
                3
              );
            }
            return null; // môn thiếu điểm
          });

          // Nếu có bất kỳ môn nào thiếu điểm → toàn bộ kết quả = NA
          if (subjectTotals.includes(null)) {
            return <strong>Kết quả thực tập: NA</strong>;
          }

          // Kiểm tra có môn nào < 7 không
          const hasFailSubject = subjectTotals.some((t) => t < 7);

          // Kết quả chung
          const finalResult =
            overallScore !== "NA" && !hasFailSubject && overallScore >= 7
              ? "PASS"
              : "FAIL";

          return <strong>Kết quả thực tập: {finalResult}</strong>;
        })()}

        
          <div>
            <strong>Đánh giá trên team:</strong>
            <input
              disabled={stopped}
              type="text"
              value={teamEvaluation}
              onChange={(e) => setTeamEvaluation(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
            {/* Chỉ hiện nút Dừng khi đang thực tập và chưa hoàn thành */}
            {!stopped && (trainingData.internStatus || "Đang thực tập") !== "Đã hoàn thành" && (
              <button className="btn-cancel" onClick={handleStopInternship}>
                Dừng thực tập
              </button>
            )}

            {/* Nút Lưu chỉ hiện và hoạt động khi CHƯA DỪNG */}
            {!stopped && (
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={(trainingData.internStatus || "Đang thực tập") === "Đã hoàn thành"}
              >
                Lưu
              </button>
            )}

            {/* Thông báo khi đã dừng hoặc đã hoàn thành */}
            {stopped && (
              <div style={{ color: "red", fontWeight: "bold", fontSize: "16px" }}>
                ĐÃ DỪNG THỰC TẬP – KHÔNG THỂ CHỈNH SỬA
              </div>
            )}

            {!stopped && (trainingData.internStatus || "Đang thực tập") === "Đã hoàn thành" && (
              <div style={{ color: "green", fontWeight: "bold", fontSize: "16px" }}>
                ĐÃ HOÀN THÀNH THỰC TẬP – KHÔNG THỂ CHỈNH SỬA
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
