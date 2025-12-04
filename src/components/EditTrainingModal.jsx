// src/components/EditTrainingModal.jsx
import React, { useCallback, useEffect, useState } from "react";
import "../styles/EditTrainingModal.css";
import api from "../services/api";

export default function EditTrainingModal({
  isOpen,
  onClose,
  trainingData,
  onSave,
  isViewOnly = false,
  courseOrder = [],
}) {
  const [scores, setScores] = useState([]);
  const [overallScore, setOverallScore] = useState("NA");
  const [teamEvaluation, setTeamEvaluation] = useState("");
  const [stopped, setStopped] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmStop, setConfirmStop] = useState(false);

  const canEdit = !stopped && !isViewOnly;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

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

  const orderScoresByCourse = useCallback(
    (scoreList = []) => {
      if (!courseOrder?.length) return scoreList;

      const ordered = courseOrder.map((course) => {
        const match = scoreList.find(
          (score) =>
            (score.courseId &&
              course.courseId &&
              score.courseId === course.courseId) ||
            score.courseName === course.courseName
        );

        return (
          match || {
            courseName: course.courseName,
            theory: "",
            attitude: "",
            practice: "",
            totalScore: null,
          }
        );
      });

      const remaining = scoreList.filter(
        (score) =>
          !courseOrder.some(
            (course) =>
              (score.courseId &&
                course.courseId &&
                score.courseId === course.courseId) ||
              score.courseName === course.courseName
          )
      );

      return [...ordered, ...remaining];
    },
    [courseOrder]
  );

  const calculateOverall = (list) => {
    const totals = list.map((s) => {
      if (isValid(s.theory) && isValid(s.attitude) && isValid(s.practice)) {
        return (
          (Number(s.theory) + Number(s.attitude) + Number(s.practice)) /
          3
        ).toFixed(1);
      }
      return "NA";
    });

    if (totals.includes("NA")) {
      setOverallScore("NA");
    } else {
      const avg = (
        totals.reduce((a, b) => a + Number(b), 0) / totals.length
      ).toFixed(1);
      setOverallScore(avg);
    }
  };

  const isCourseComplete = (score) =>
    isValid(score.theory) && isValid(score.attitude) && isValid(score.practice);

  const isCourseUnlocked = (index, list = scores) => {
    if (!canEdit) return false;
    if (index === 0) return true;
    return list.slice(0, index).every((s) => isCourseComplete(s));
  };

  const handleScoreChange = (index, key, value) => {
    if (!isCourseUnlocked(index)) return;
    const newScores = [...scores];
    newScores[index][key] = value;
    setScores(newScores);
    calculateOverall(newScores);
  };

  const handleStopInternship = async () => {
    try {
      const response = await api.put(
        `/trainings/${trainingData.internId}/stop`
      );
      onSave(response.data);
      setStopped(true);
      setConfirmStop(false);
      onClose();
      showToast("Đã dừng thực tập thành công!");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi dừng thực tập!", "error");
    }
  };

  const handleSave = async () => {
    const processedScores = scores.map((s) => ({
      courseName: s.courseName,
      theoryScore: s.theory !== "" ? Number(s.theory) : null,
      attitudeScore: s.attitude !== "" ? Number(s.attitude) : null,
      practiceScore: s.practice !== "" ? Number(s.practice) : null,
    }));

    const validScores = processedScores.filter(
      (s) =>
        s.theoryScore !== null &&
        s.attitudeScore !== null &&
        s.practiceScore !== null
    );

    const overall =
      validScores.length > 0
        ? (
            validScores.reduce(
              (sum, s) =>
                sum +
                (s.theoryScore + s.attitudeScore + s.practiceScore) / 3,
              0
            ) / validScores.length
          ).toFixed(2)
        : null;

    const hasIncomplete = processedScores.some(
      (s) =>
        s.theoryScore === null ||
        s.attitudeScore === null ||
        s.practiceScore === null
    );
    const hasFailSubject = validScores.some(
      (s) =>
        (s.theoryScore + s.attitudeScore + s.practiceScore) / 3 < 7
    );

    const internshipResult = hasIncomplete
      ? "NA"
      : overall >= 7 && !hasFailSubject
      ? "PASS"
      : "FAIL";

    const payload = {
      scores: processedScores,
      summaryResult: overall !== null ? Number(overall) : null,
      teamReview:
        teamEvaluation !== "" && !isNaN(teamEvaluation)
          ? Number(teamEvaluation)
          : null,
      internshipResult,
    };

    try {
      const response = await api.put(
        `/trainings/${trainingData.internId}/scores`,
        payload
      );
      onSave(response.data);
      onClose();
      showToast("Lưu điểm thành công!");
    } catch (err) {
      console.error("Lỗi lưu điểm:", err.response?.data || err.message);
      showToast("Lỗi khi lưu điểm!", "error");
    }
  };

  useEffect(() => {
    if (!trainingData) return;

    const status = trainingData.internStatus || "Đang thực tập";
    setStopped(status === "Đã dừng thực tập");

    const rawScores = (trainingData.scores || []).map((s) => ({
      courseName: s.courseName,
      theory: s.theoryScore != null ? s.theoryScore : "",
      attitude: s.attitudeScore != null ? s.attitudeScore : "",
      practice: s.practiceScore != null ? s.practiceScore : "",
      totalScore: s.totalScore,
    }));

    const initScores = orderScoresByCourse(rawScores);

    setScores(initScores);
    calculateOverall(initScores);
    setTeamEvaluation(trainingData.teamReview || "");
  }, [orderScoresByCourse, trainingData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-close" onClick={onClose}>
          ✕
        </div>
        <h2>Kết quả học tập</h2>

        <div className="training-info">
          <div>
            Họ và tên:{" "}
            {trainingData?.traineeName ||
              trainingData?.fullName ||
              trainingData?.name ||
              "NA"}
          </div>
          <div>
            Ngày bắt đầu: {trainingData?.startDate} | Số ngày thực tập:{" "}
            {trainingData?.trainingDays ??
              trainingData?.soNgayThucTap ??
              "NA"}
          </div>
          <div>Ngày kết thúc: {trainingData?.endDate || "Chưa kết thúc"}</div>
        </div>

        <div className="scores-table">
          <div className="scores-header">
            <div className="subject-cell">Môn học</div>
            <div className="subject-cell">Lý thuyết</div>
            <div className="subject-cell">Thái độ</div>
            <div className="subject-cell">Thực hành</div>
            <div className="subject-cell">Tổng</div>
          </div>

          {scores.map((s, i) => {
            const valid3 = isCourseComplete(s);
            const courseUnlocked = isCourseUnlocked(i);
            const total = valid3
              ? (
                  (Number(s.theory) +
                    Number(s.attitude) +
                    Number(s.practice)) /
                  3
                ).toFixed(1)
              : "NA";

            return (
              <div
                key={i}
                className={`scores-row ${
                  courseUnlocked ? "" : "score-locked"
                }`}
              >
                <div className="subject-cell">{s.courseName}</div>
                {["theory", "attitude", "practice"].map((key) => (
                  <div className="subject-cell" key={key}>
                    <input
                      disabled={!courseUnlocked}
                      type="text"
                      value={s[key]}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value === "") {
                          handleScoreChange(i, key, "");
                          return;
                        }
                        if (/^\d*\.?\d*$/.test(value)) {
                          let num = parseFloat(value);
                          if (!isNaN(num)) {
                            if (num > 10) num = 10;
                            if (num < 0) num = 0;
                            handleScoreChange(i, key, num);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
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
                      
                      style={{
                        width: "60px",
                        padding: "4px",
                        textAlign: "center",
                        fontSize: "14px",
                      }}
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

        <div className="overall-scores">
          <strong>
            Tổng kết:{" "}
            {overallScore !== "NA" ? (
              <span className="total-flex">
                <span>{overallScore}</span>
                {renderIcon(Number(overallScore))}
              </span>
            ) : (
              "NA"
            )}
          </strong>

          {(() => {
            const subjectTotals = scores.map((s) =>
              isValid(s.theory) &&
              isValid(s.attitude) &&
              isValid(s.practice)
                ? (Number(s.theory) +
                    Number(s.attitude) +
                    Number(s.practice)) /
                  3
                : null
            );

            if (subjectTotals.includes(null))
              return <strong>Kết quả thực tập: NA</strong>;

            const hasFailSubject = subjectTotals.some((t) => t < 7);
            const finalResult =
              overallScore !== "NA" &&
              !hasFailSubject &&
              overallScore >= 7
                ? "PASS"
                : "FAIL";

            return <strong>Kết quả thực tập: {finalResult}</strong>;
          })()}

          <div>
            <strong>Đánh giá trên team:</strong>
            <input
              disabled={!canEdit}
              type="text"
              value={teamEvaluation}
              onChange={(e) => setTeamEvaluation(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          {!stopped &&
            (trainingData.internStatus || "Đang thực tập") !==
              "Đã hoàn thành" && (
              <button
                className="btn-cancel"
                onClick={() => setConfirmStop(true)}
              >
                Dừng thực tập
              </button>
            )}

          {canEdit && (
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={
                (trainingData.internStatus || "Đang thực tập") ===
                "Đã hoàn thành"
              }
            >
              Lưu
            </button>
          )}
        </div>

        {confirmStop && (
          <div className="modal-overlay">
            <div className="modal-content confirm-modal">
              <p>Bạn có chắc chắn muốn dừng thực tập không?</p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setConfirmStop(false)}
                >
                  Hủy
                </button>
                <button className="btn-save" onClick={handleStopInternship}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`toast-container ${
              toast.type === "success" ? "toast-success" : "toast-error"
            }`}
            role="status"
          >
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}
