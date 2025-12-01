// src/components/AIAssistantBubble.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ai-assistant.css";
import assistantAvatar from "../assets/tro-ly-phuc.png";

export default function AIAssistantBubble({ trainings = [], planOptions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);

  const [hasInitOverview, setHasInitOverview] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const getPlanNameById = (planId) => {
    if (!planId) return null;
    const p = (planOptions || []).find(
      (pl) =>
        String(pl.id ?? pl.planId ?? pl.recruitmentPlanId) === String(planId)
    );
    return p?.name || p?.planName || `Kế hoạch #${planId}`;
  };

  const COURSE_SEQUENCE = [
    { name: "Git & GitHub", cumulativeDays: 2 },
    { name: "Lập trình hướng đối tượng (OOP)", cumulativeDays: 7 },
    { name: "Cơ sở dữ liệu (SQL)", cumulativeDays: 10 },
    { name: "Web cơ bản (HTML - CSS - JavaScript)", cumulativeDays: 15 },
    { name: "Java Core & Spring Boot", cumulativeDays: 22 },
  ];

  const getProgressPhase = (training) => {
    const trainingDays = Number(
      training.trainingDays ??
        training.soNgayThucTap ??
        training.soNgayTT ??
        null
    );

    if (!trainingDays || Number.isNaN(trainingDays)) return null;

    const scores = Array.isArray(training.scores) ? training.scores : [];

    let lastCompletedIndex = -1;
    COURSE_SEQUENCE.forEach((c, idx) => {
      const s = scores.find((sc) => sc.courseName === c.name);
      if (s?.theoryScore && s?.practiceScore && s?.attitudeScore)
        lastCompletedIndex = idx;
    });

    if (lastCompletedIndex === -1) return null;

    const currentCourse = COURSE_SEQUENCE[lastCompletedIndex];
    const targetDays = currentCourse.cumulativeDays;

    let status = "ĐÚNG TIẾN ĐỘ";
    if (trainingDays > targetDays) status = "CHẬM";
    if (trainingDays < targetDays) status = "NHANH";

    return {
      trainingDays,
      currentCourseName: currentCourse.name,
      status,
    };
  };

  const buildDelayOverviewByPlan = () => {
    if (!trainings || trainings.length === 0) return [];

    const byPlan = {};

    trainings.forEach((t) => {
      const planId =
        t.recruitmentPlanId ??
        t.planId ??
        t.recruitmentPlan?.id ??
        t.recruitmentPlan?.planId;

      if (!planId) return;

      const phase = getProgressPhase(t);
      if (!phase || phase.status !== "CHẬM") return;

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

  // ================== TỰ BẬT POPUP VÀ HIỂN THỊ TTS CHẬM TIẾN ==================
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
      overview,
    };

    // Chèn OVERVIEW lên đầu danh sách
    setMessages((prev) => [overviewMsg, ...prev]);
    setIsOpen(true);
    setHasInitOverview(true);
  }, [trainings, planOptions, hasInitOverview]);

  // ================== MESSAGE CHÀO ==================
  useEffect(() => {
    // chỉ thêm message chào nếu hiện chưa có message nào
    if (messages.length > 0) return;

    const welcomeMsg = {
      id: 999999,
      sender: "ai",
      type: "text",
      text:
        "Xin chào 👋 Mình là trợ lý AI của hệ thống đào tạo. Bạn có thể:\n" +
        "1. thống kê trạng thái tts\n" +
        "2. tổng số tts\n" +
        "3. thống kê kết quả thực tập (PASS/FAIL)\n" +
        "4. điểm trung bình TTS đã hoàn thành trong một kế hoạch (gõ: 4 [mã/ký tự kế hoạch], ví dụ: '4 15' hoặc '4 qq')",
    };

    setMessages([welcomeMsg]);
  }, [messages.length]);

  // ========= MAP PHÍM TẮT "1" / "2" / "3" / "4" =========
  const resolveShortcut = (raw) => {
    const trimmed = raw.trim();

    if (trimmed === "1") return "thống kê trạng thái tts";
    if (trimmed === "2") return "tổng số tts";
    if (trimmed === "3")
      return "thống kê kết quả thực tập theo PASS/FAIL";

    // 4 [planId or keyword] -> tính điểm TB theo kế hoạch
    const match4 = trimmed.match(/^4\s+(.+)$/);
    if (match4) {
      const key = match4[1].trim();
      if (/^\d+$/.test(key)) {
        // toàn số → coi là id
        return `điểm trung bình của các thực tập sinh đã hoàn thành trong kế hoạch có id ${key}`;
      }
      // còn lại → coi là từ khóa trong tên kế hoạch
      return `điểm trung bình của các thực tập sinh đã hoàn thành trong kế hoạch có từ khóa "${key}"`;
    }

    return raw; // không phải phím tắt → giữ nguyên
  };

  // ================== GỬI TIN ==================
  const handleSend = async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    const content = resolveShortcut(raw);

    const userMsg = {
      id: Date.now(),
      sender: "user",
      type: "text",
      text: content, // hiển thị luôn câu hỏi đã map
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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "ai",
          type: "text",
          text:
            "Bé chưa hiểu câu hỏi của anh/chị ạ, anh/chị hãy ghi rõ câu hỏi hơn giúp bé với ạ ❤️",
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

  // ================== RENDER MESSAGE ==================
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
      {/* === Nút mở chat === */}
      <button className="ai-bubble-btn" onClick={toggleOpen}>
        <img src={assistantAvatar} className="ai-bubble-avatar" />
      </button>

      {/* === Khung chat === */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-chat-avatar">
                <img src={assistantAvatar} />
              </div>

              <div>
                <div className="ai-chat-title">Trợ lý Phúc</div>
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
              placeholder="Nhập câu hỏi…"
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
