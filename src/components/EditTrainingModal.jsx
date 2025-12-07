// src/components/EditTrainingModal.jsx
import React, { useEffect, useState } from "react";
import "../styles/EditTrainingModal.css";
import api from "../services/api";

export default function EditTrainingModal({
  isOpen,
  onClose,
  trainingData,
  onSave,
  isViewOnly = false,
}) {
  const [allCourses, setAllCourses] = useState([]);
  const [scoresMap, setScoresMap] = useState({});
  const [summaryResult, setSummaryResult] = useState("N/A");
  const [teamReview, setTeamReview] = useState("");
  const [internshipResult, setInternshipResult] = useState("Chưa kết luận"); // Hiển thị
  const [dbInternshipResult, setDbInternshipResult] = useState(""); // Giá trị thật từ DB
  const [stopped, setStopped] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [editingBelow7, setEditingBelow7] = useState({});

  const canEdit = !stopped && !isViewOnly && trainingData?.internStatus !== "Đã hoàn thành";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(null), 3000);
  };

  const renderIcon = (score) => {
    if (!score || score === "N/A") return null;
    const num = Number(score);
    return num >= 7 ? (
      <svg width="16" height="16" fill="#22c55e"><path d="M6.173 14.727L2.1 10.654l1.4-1.4 2.673 2.673 6.727-6.727 1.4 1.4z" /></svg>
    ) : (
      <svg width="16" height="16" fill="#ef4444"><path d="M4.222 3l5.364 5.364L14.95 3l1.414 1.414-5.364 5.364 5.364 5.364-1.414 1.414-5.364-5.364L4.222 15.55 2.808 14.136l5.364-5.364L2.808 3z" /></svg>
    );
  };

  const calculateSubjectTotal = (s) => {
    if (!s.theoryScore || !s.practiceScore || !s.attitudeScore) return null;
    return ((s.theoryScore + s.practiceScore + s.attitudeScore) / 3).toFixed(2);
  };

  // TÍNH KẾT QUẢ ĐỂ GỬI LÊN BE KHI LƯU
  const calculateResultForSave = () => {
    const completed = allCourses.filter(course => {
      const s = scoresMap[course.courseName] || {};
      return s.theoryScore != null && s.practiceScore != null && s.attitudeScore != null;
    });

    if (completed.length !== allCourses.length) return null;

    const avg = completed.reduce((sum, course) => {
      const s = scoresMap[course.courseName] || {};
      return sum + (s.theoryScore + s.practiceScore + s.attitudeScore) / 3;
    }, 0) / completed.length;

    const hasFail = completed.some(course => {
      const s = scoresMap[course.courseName] || {};
      return (s.theoryScore + s.practiceScore + s.attitudeScore) / 3 < 7;
    });

    return avg >= 7 && !hasFail ? "Đạt" : "Không đạt";
  };

  const isCourseUnlocked = (index) => {
    if (!canEdit) return false;
    if (index === 0) return true;
    const prev = scoresMap[allCourses[index - 1].courseName] || {};
    return prev.theoryScore != null && prev.practiceScore != null && prev.attitudeScore != null;
  };

  const handleScoreChange = (courseName, field, inputValue) => {
    if (!canEdit) return;

    const value = inputValue.trim();
    let num = value === "" ? null : parseFloat(value);

    if (num !== null) {
      if (isNaN(num)) return;
      num = Math.round(num * 2) / 2;
      if (num < 0) num = 0;
      if (num > 10) num = 10;
    }

    setScoresMap(prev => {
      const updated = { ...prev };
      if (!updated[courseName]) {
        updated[courseName] = {
          courseName, theoryScore: null, practiceScore: null, attitudeScore: null,
          reason: "", history: [], totalAttempts: 0, remainingAttempts: 3
        };
      }
      updated[courseName][field] = num;

      const tempTotal = updated[courseName].theoryScore != null &&
        updated[courseName].practiceScore != null &&
        updated[courseName].attitudeScore != null
        ? (updated[courseName].theoryScore + updated[courseName].practiceScore + updated[courseName].attitudeScore) / 3
        : null;

      const isBelow7 = tempTotal !== null && tempTotal < 7;
      setEditingBelow7(prevEdit => ({ ...prevEdit, [courseName]: isBelow7 }));

      return updated;
    });
  };

  const handleReasonChange = (courseName, val) => {
    setScoresMap(prev => ({
      ...prev,
      [courseName]: { ...prev[courseName], reason: val },
    }));
  };

  const handleSave = async () => {
    const originalScores = trainingData.scores || [];

    const changedScores = allCourses
      .map(course => {
        const current = scoresMap[course.courseName] || {};
        const original = originalScores.find(s => s.courseName === course.courseName);

        const total = calculateSubjectTotal(current);
        const needReason = total && Number(total) < 7;

        if (!current.theoryScore || !current.practiceScore || !current.attitudeScore) return null;

        if (original &&
          original.theoryScore === current.theoryScore &&
          original.practiceScore === current.practiceScore &&
          original.attitudeScore === current.attitudeScore) {
          return null;
        }

        if (needReason && (!current.reason || current.reason.trim() === "")) {
          showToast(`Môn "${course.courseName}" điểm ${total} < 7 → Bắt buộc nhập lý do!`, "error");
          return null;
        }

        return {
          courseName: course.courseName,
          theoryScore: current.theoryScore,
          practiceScore: current.practiceScore,
          attitudeScore: current.attitudeScore,
          reason: needReason ? current.reason : null,
        };
      })
      .filter(Boolean);

    // TỰ ĐỘNG GỬI KẾT QUẢ "Đạt" / "Không đạt" KHI ĐỦ ĐIỂM
    const autoResult = calculateResultForSave();

    const payload = {
      scores: changedScores.length > 0 ? changedScores : undefined,
      summaryResult: summaryResult !== "N/A" ? Number(summaryResult) : null,
      teamReview: teamReview !== (trainingData.teamReview || "") ? teamReview : undefined,
      internshipResult: autoResult || undefined, // Chỉ gửi khi có thay đổi
    };

    try {
      const res = await api.put(`/trainings/${trainingData.internId}/scores`, payload);
      onSave(res.data);
      onClose();
      showToast("Lưu điểm thành công!");
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi lưu điểm", "error");
    }
  };

  const handleStopInternship = async () => {
    try {
      const res = await api.put(`/trainings/${trainingData.internId}/stop`);
      onSave(res.data);
      setStopped(true);
      setConfirmStop(false);
      onClose();
      showToast("Đã dừng thực tập thành công!");
    } catch (err) {
      showToast("Lỗi khi dừng thực tập!", "error");
    }
  };

  useEffect(() => {
    if (!trainingData || !isOpen) return;

    setStopped(trainingData.internStatus === "Đã dừng thực tập");

    api.get("/courses")
      .then(res => {
        const courses = Array.isArray(res.data) ? res.data : [];
        setAllCourses(courses);

        const map = {};
        courses.forEach(course => {
          const existing = (trainingData.scores || []).find(s => s.courseName === course.courseName);
          map[course.courseName] = existing ? { ...existing } : {
            courseName: course.courseName,
            theoryScore: null, practiceScore: null, attitudeScore: null,
            totalScore: null, reason: "", history: [], totalAttempts: 0, remainingAttempts: 3
          };
        });
        setScoresMap(map);
        setEditingBelow7({});
      });

    setTeamReview(trainingData.teamReview || "");
    setSummaryResult(trainingData.summaryResult != null ? Number(trainingData.summaryResult).toFixed(2) : "N/A");

    // LẤY ĐÚNG KẾT QUẢ TỪ DB ĐỂ HIỂN THỊ KHI XEM
    const resultFromDb = trainingData.internshipResult || "Chưa kết luận";
    setDbInternshipResult(resultFromDb);
    setInternshipResult(resultFromDb);
  }, [trainingData, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="edit-training-modal">
        <div className="modal-header">
          <h2>Kết quả học tập - {trainingData.fullName}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="training-info-grid">
            <div>
              <strong>Ngày bắt đầu:</strong> {trainingData.startDate ? new Date(trainingData.startDate).toLocaleDateString("vi-VN") : "N/A"}
            </div>
            <div>
              <strong>Ngày kết thúc:</strong>{" "}
              {trainingData.endDate ? (
                <span>{new Date(trainingData.endDate).toLocaleDateString("vi-VN")}</span>
              ) : (
                <span>Chưa kết thúc</span>
              )}
            </div>
            <div><strong>Số ngày thực tập:</strong> {trainingData.trainingDays ?? "N/A"}</div>
            <div>
              <strong>Trạng thái:</strong>{" "}
              <span className="status-badge">{trainingData.internStatus}</span>
            </div>
          </div>

          <div className="scores-table-container">
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Lý thuyết</th>
                  <th>Thực hành</th>
                  <th>Thái độ</th>
                  <th>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {allCourses.map((course, index) => {
                  const s = scoresMap[course.courseName] || {};
                  const total = calculateSubjectTotal(s);
                  const canRetake = s.remainingAttempts > 0 && canEdit;
                  const isUnlocked = isCourseUnlocked(index);
                  const isCurrentlyBelow7 = editingBelow7[course.courseName] === true;

                  return (
                    <React.Fragment key={course.courseId}>
                      <tr className={(!isViewOnly && (!canRetake || !isUnlocked)) ? "row-disabled" : ""}>
                        <td className="subject-name">
                          {course.courseName}
                          {!isViewOnly && !isUnlocked && index > 0 && (
                            <span className="lock-hint">Hoàn thành môn trước</span>
                          )}
                        </td>

                        {["theoryScore", "practiceScore", "attitudeScore"].map(field => (
                          <td key={field}>
                            <input
                              type="text"
                              inputMode="decimal"
                              disabled={!canRetake || !isUnlocked}
                              value={s[field] ?? ""}
                              onChange={(e) => handleScoreChange(course.courseName, field, e.target.value)}
                              className="score-input"
                              placeholder="0 - 10"
                            />
                          </td>
                        ))}

                        <td className="total-cell">
                          {total ? (
                            <div className="total-with-history">
                              <span className="total-score">{total}</span>
                              {renderIcon(total)}
                              {s.history?.length > 0 && (
                                <div className="history-trigger" onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedHistory(expandedHistory === course.courseName ? null : course.courseName);
                                }}>
                                  {expandedHistory === course.courseName ? "Up Arrow" : "Down Arrow"}
                                </div>
                              )}
                            </div>
                          ) : "N/A"}
                        </td>
                      </tr>

                      {isCurrentlyBelow7 && canRetake && isUnlocked && (
                        <tr className="reason-expanded-row">
                          <td colSpan="5" className="reason-detail">
                            <div className="reason-title">
                              Lý do điểm môn <strong>{course.courseName}</strong> dưới 7
                            </div>
                            <textarea
                              placeholder="Nhập lý do tại đây... (bắt buộc khi lưu)"
                              value={s.reason || ""}
                              onChange={(e) => handleReasonChange(course.courseName, e.target.value)}
                              className="reason-textarea"
                              rows="2"
                            />
                          </td>
                        </tr>
                      )}

                      {expandedHistory === course.courseName && s.history?.length > 0 && (
                        <tr className="history-expanded-row">
                          <td colSpan="5" className="history-detail">
                            <div className="history-title">
                              Lịch sử chấm điểm ({s.history.length} lần)
                            </div>
                            <table className="inner-history-table">
                              <thead>
                                <tr><th>Lần</th><th>Lý thuyết</th><th>Thực hành</th><th creen>Thái độ</th><th>Tổng</th><th>Lý do</th></tr>
                              </thead>
                              <tbody>
                                {s.history.map((h, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{h.attemptNumber}</strong></td>
                                    <td>{h.theoryScore}</td>
                                    <td>{h.practiceScore}</td>
                                    <td>{h.attitudeScore}</td>
                                    <td>{h.totalScore?.toFixed(2)}</td>
                                    <td className="reason-text">{h.reason || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="summary-section">
            <div className="summary-top-row">
              <div><strong>Tổng kết:</strong> {summaryResult} {renderIcon(summaryResult)}</div>
              <div>
                <strong>Kết quả thực tập:</strong>{" "}
                <span className={`status-badge ${internshipResult === "Đạt" ? "status-completed" : internshipResult === "Không đạt" ? "status-stopped" : ""}`}>
                  {internshipResult}
                </span>
              </div>
            </div>

            <div className="team-review-full">
              <label><strong>Đánh giá team:</strong></label>
              <textarea
                disabled={!canEdit}
                value={teamReview}
                onChange={(e) => setTeamReview(e.target.value)}
                placeholder="Nhập đánh giá chi tiết về thực tập sinh..."
                className="team-review-textarea"
                rows="4"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            {!isViewOnly && trainingData.internStatus !== "Đã hoàn thành" && trainingData.internStatus !== "Đã dừng thực tập" && (
              <button className="btn-stop" onClick={() => setConfirmStop(true)}>
                Dừng thực tập
              </button>
            )}
          </div>
          <div className="footer-right">
            {canEdit && (
              <button className="btn-save" onClick={handleSave}>
                Lưu điểm
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmStop && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <p>Xác nhận dừng thực tập cho <strong>{trainingData.fullName}</strong>?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmStop(false)}>Hủy</button>
              <button className="btn-save" onClick={handleStopInternship}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}