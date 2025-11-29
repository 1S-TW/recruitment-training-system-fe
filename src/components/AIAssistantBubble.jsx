// src/components/AIAssistantBubble.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ai-assistant.css";

export default function AIAssistantBubble({ trainings = [], planOptions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // messages: hỗ trợ cả text thường và message dạng "overview" (bảng)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      type: "text",
      text:
        "Xin chào 👋 Mình là trợ lý AI của hệ thống đào tạo. Bạn có thể hỏi:\n" +
        "- Số lượng thực tập sinh hiện tại là bao nhiêu?\n" +
        "- Có bao nhiêu TTS đang thực tập?\n" +
        "- Kết quả PASS/FAIL theo kế hoạch?...\n" +
        "- Tiến độ TTS theo từng môn Git, OOP, SQL, Web, Java...",
    },
  ]);

  // để chỉ auto khởi tạo 1 lần
  const [hasInitOverview, setHasInitOverview] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  // ====== Helper: lấy tên kế hoạch theo planId từ planOptions ======
  const getPlanNameById = (planId) => {
    if (!planId) return null;
    const p = (planOptions || []).find(
      (pl) =>
        String(pl.id ?? pl.planId ?? pl.recruitmentPlanId) === String(planId)
    );
    return p?.name || p?.planName || `Kế hoạch #${planId}`;
  };

  // ====== Chuỗi môn học & số ngày tích lũy chuẩn ======
  // Tổng 22 ngày:
  // Git: 2; OOP: 7; SQL: 10; Web: 15; Java: 22
  const COURSE_SEQUENCE = [
    { name: "Git & GitHub", cumulativeDays: 2 },
    { name: "Lập trình hướng đối tượng (OOP)", cumulativeDays: 7 },
    { name: "Cơ sở dữ liệu (SQL)", cumulativeDays: 10 },
    { name: "Web cơ bản (HTML - CSS - JavaScript)", cumulativeDays: 15 },
    { name: "Java Core & Spring Boot", cumulativeDays: 22 },
  ];

  // ====== Helper: xác định môn hiện tại & nhịp độ (NHANH/ĐÚNG/CHẬM) cho 1 TTS ======
  const getProgressPhase = (training) => {
    const trainingDaysRaw =
      training.trainingDays ??
      training.soNgayThucTap ??
      training.soNgayTT ??
      null;
    const trainingDays =
      trainingDaysRaw != null ? Number(trainingDaysRaw) : null;
    if (trainingDays == null || Number.isNaN(trainingDays)) {
      return null;
    }

    const scores = Array.isArray(training.scores) ? training.scores : [];

    // Tìm môn cao nhất đã hoàn thành (đủ 3 đầu điểm)
    let lastCompletedIndex = -1;

    COURSE_SEQUENCE.forEach((course, index) => {
      const s = scores.find(
        (sc) => sc.courseName && sc.courseName.trim() === course.name
      );
      if (
        s &&
        s.theoryScore != null &&
        s.practiceScore != null &&
        s.attitudeScore != null
      ) {
        lastCompletedIndex = index;
      }
    });

    // Nếu chưa có môn nào đủ 3 đầu điểm => chưa đánh giá tiến độ
    if (lastCompletedIndex === -1) {
      return null;
    }

    const currentCourse = COURSE_SEQUENCE[lastCompletedIndex];
    const targetDays = currentCourse.cumulativeDays;

    let status;
    if (trainingDays > targetDays) {
      status = "CHẬM";
    } else if (trainingDays === targetDays) {
      status = "ĐÚNG TIẾN ĐỘ";
    } else {
      status = "NHANH";
    }

    return {
      trainingDays,
      currentCourseName: currentCourse.name,
      status,
    };
  };

  // ====== Tính danh sách TTS chậm tiến độ theo từng kế hoạch ======
  const buildDelayOverviewByPlan = () => {
    if (!Array.isArray(trainings) || trainings.length === 0) return [];

    const byPlan = {};

    trainings.forEach((t) => {
      const planId =
        t.recruitmentPlanId ??
        t.planId ??
        t.recruitmentPlan?.id ??
        t.recruitmentPlan?.planId;

      if (!planId) return;

      const phase = getProgressPhase(t);
      if (!phase) return; // không đánh giá được

      if (phase.status !== "CHẬM") return; // chỉ lấy các bạn chậm tiến độ

      const internName =
        t.traineeName || t.fullName || t.name || "Không rõ tên";

      if (!byPlan[planId]) {
        byPlan[planId] = {
          planId,
          planName: getPlanNameById(planId),
          interns: [],
        };
      }

      byPlan[planId].interns.push({
        name: internName,
        currentCourseName: phase.currentCourseName,
        trainingDays: phase.trainingDays,
      });
    });

    return Object.values(byPlan);
  };

  // ====== Auto bật chat + gửi message overview dạng bảng khi có dữ liệu ======
  useEffect(() => {
    if (hasInitOverview) return;
    const overview = buildDelayOverviewByPlan();
    if (!overview || overview.length === 0) return;

    const overviewMsg = {
      id: Date.now(),
      sender: "ai",
      type: "delayOverview",
      intro:
        "Chào anh/chị 👋\n" +
        "Dưới đây là các kế hoạch tuyển dụng đang có thực tập sinh CHẬM TIẾN ĐỘ (so với mốc 22 ngày cho 5 môn):",
      overview, // mảng {planId, planName, interns: [{name, currentCourseName, trainingDays}]}
    };

    setMessages((prev) => [...prev, overviewMsg]);
    setIsOpen(true); // auto bật cửa sổ
    setHasInitOverview(true);
  }, [trainings, planOptions, hasInitOverview]);

  // ====== Gửi câu hỏi lên BE AI ======
  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      type: "text",
      text: content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      setLoading(true);
      const res = await api.post("/ai/chat", { message: content });

      const replyText =
        typeof res.data === "string"
          ? res.data
          : res.data.reply || JSON.stringify(res.data);

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        text: replyText,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi gọi AI:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "ai",
          type: "text",
          text:
            "Xin lỗi, hiện tại mình không trả lời được. Bạn thử lại sau nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ====== Render 1 message ======
  const renderMessage = (m) => {
    if (m.type === "delayOverview") {
      return (
        <div key={m.id} className="ai-chat-message ai-msg-ai ai-card">
          {m.intro.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}

          {m.overview.map((plan) => (
            <div key={plan.planId} className="ai-plan-block">
              <div className="ai-plan-heading">
                <span className="ai-pill">Kế hoạch</span>
                <span className="ai-plan-name">{plan.planName}</span>
                <span className="ai-plan-count">
                  {plan.interns.length} bạn chậm tiến độ
                </span>
              </div>
              <div className="ai-table-wrapper">
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên TTS</th>
                      <th>Môn hiện tại</th>
                      <th>Số ngày TT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.interns.map((intern, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{intern.name}</td>
                        <td>{intern.currentCourseName}</td>
                        <td>{intern.trainingDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // message text bình thường
    return (
      <div
        key={m.id}
        className={`ai-chat-message ${
          m.sender === "user" ? "ai-msg-user" : "ai-msg-ai"
        }`}
      >
        {m.text.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Nút tròn mở chat */}
      <button className="ai-bubble-btn" onClick={toggleOpen}>
        AI
      </button>

      {/* Hộp chat */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-chat-avatar">AI</div>
              <div>
                <div className="ai-chat-title">Trợ lý AI</div>
                <div className="ai-chat-subtitle">
                  Đồng hành cùng quản lý đào tạo
                </div>
                <div className="ai-badge-online">
                  <span className="ai-dot" /> Luôn sẵn sàng hỗ trợ
                </div>
              </div>
            </div>
            <button className="ai-chat-close" onClick={toggleOpen}>
              ✕
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((m) => renderMessage(m))}
            {loading && (
              <div className="ai-chat-message ai-msg-ai ai-typing">
                Đang suy nghĩ...
              </div>
            )}
          </div>

          <div className="ai-chat-input-row">
            <textarea
              className="ai-chat-input"
              placeholder='Nhập câu hỏi… (VD: "Hãy cho tôi tiến độ của thực tập sinh có trong kế hoạch tuyển dụng cc của môn Git & GitHub")'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              className="ai-chat-send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
