// src/components/AIAssistantBubble.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/ai-assistant.css";
import assistantAvatar from "../assets/tro-ly-phuc.png";

export default function AIAssistantBubble({
  trainings = [],
  planOptions = [],
  courseOrder = [], // ✅ nhận lộ trình môn từ DB
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const getPlanNameById = (planId) => {
    if (!planId) return null;
    const p = (planOptions || []).find(
      (pl) =>
        String(pl.id ?? pl.planId ?? pl.recruitmentPlanId) === String(planId)
    );
    return p?.name || p?.planName || `Kế hoạch #${planId}`;
  };

  // ✅ Build lộ trình từ courseOrder: cumulativeDays dựa trên durationDays trong DB
  const courseTimeline = useMemo(() => {
    if (!Array.isArray(courseOrder) || courseOrder.length === 0) return [];

    let cumulative = 0;
    return courseOrder
      .map((c) => {
        const daysRaw =
          c.durationDays ??
          c.courseDuration ??
          c.expectedDays ??
          c.duration ??
          0;

        const days = Number(daysRaw);
        if (!Number.isFinite(days) || days < 0) return null;

        cumulative += days;

        return {
          courseId: c.courseId ?? c.id,
          name: c.courseName || c.name || "Môn không tên",
          durationDays: days,
          cumulativeDays: cumulative,
        };
      })
      .filter(Boolean);
  }, [courseOrder]);

  // ✅ Tính tiến độ một TTS: đang ở môn nào, lẽ ra bao nhiêu ngày, thực tế bao nhiêu ngày
  const getProgressPhase = (training) => {
    const trainingDays = Number(
      training.trainingDays ??
        training.soNgayThucTap ??
        training.soNgayTT ??
        null
    );

    if (!trainingDays || Number.isNaN(trainingDays)) return null;
    if (!courseTimeline.length) return null;

    const scores = Array.isArray(training.scores) ? training.scores : [];

    let lastCompletedIndex = -1;

    courseTimeline.forEach((c, idx) => {
      const s = scores.find(
        (sc) =>
          (sc.courseId && c.courseId && sc.courseId === c.courseId) ||
          sc.courseName === c.name
      );

      if (
        s &&
        s.theoryScore != null &&
        s.practiceScore != null &&
        s.attitudeScore != null
      ) {
        lastCompletedIndex = idx;
      }
    });

    if (lastCompletedIndex === -1) return null;

    const currentCourse = courseTimeline[lastCompletedIndex];
    const targetDays =
      Number(currentCourse.cumulativeDays) && currentCourse.cumulativeDays > 0
        ? currentCourse.cumulativeDays
        : trainingDays;

    let status = "ĐÚNG TIẾN ĐỘ";
    if (trainingDays > targetDays) status = "CHẬM";
    else if (trainingDays < targetDays) status = "NHANH";

    return {
      trainingDays,
      currentCourseName: currentCourse.name,
      status,
      targetDays,
    };
  };

  // ✅ Gom TTS chậm theo kế hoạch + lọc theo keyword nếu có
  const buildDelayOverviewByPlan = (keywordRaw) => {
    if (!trainings || trainings.length === 0 || !courseTimeline.length) return [];

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

      const delayDays = Math.max(0, phase.trainingDays - phase.targetDays);

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
        delayDays,
      });
    });

    let groups = Object.values(byPlan);

    if (!keywordRaw) {
      return groups;
    }

    const key = keywordRaw.toLowerCase().trim();
    if (!key) return groups;

    const isNumeric = /^\d+$/.test(key);

    // 🔹 Nếu toàn số → hiểu là ID kế hoạch → so sánh đúng ID, KHÔNG dò trong tên
    if (isNumeric) {
      const byId = groups.filter(
        (g) => String(g.planId) === key || String(g.planId) === String(Number(key))
      );
      if (byId.length > 0) {
        return byId.map((g) => ({
          ...g,
          interns: [...g.interns].sort((a, b) => b.delayDays - a.delayDays),
        }));
      }
    }

    const byName = groups.filter((g) =>
      (g.planName || "").toLowerCase().includes(key)
    );

    return byName.map((g) => ({
      ...g,
      interns: [...g.interns].sort((a, b) => b.delayDays - a.delayDays),
    }));
  };

  // ================== MESSAGE CHÀO ==================
  useEffect(() => {
    if (messages.length > 0) return;

    const welcomeMsg = {
      id: 999999,
      sender: "ai",
      type: "text",
      text:
        "Chào bạn 👋\n" +
        "Mình là Trợ lý Phúc, giúp bạn theo dõi tiến độ thực tập sinh.\n\n" +
        'Để xem kế hoạch nào có TTS chậm, hãy gõ: chậm + tên kế hoạch\n' +
        'Ví dụ: tts chậm tháng 12 (trong đó "tháng 12" là tên kế hoạch).',
    };

    setMessages([welcomeMsg]);
  }, [messages.length]);

  // ========= XỬ LÝ RIÊNG CÂU HỎI VỀ "CHẬM" =========
  const handleDelayQuery = (rawContent) => {
    const lower = rawContent.toLowerCase().trim();

    // Trường hợp chỉ gõ "chậm" / "tts chậm" → hỏi lại cho rõ
    if (
      lower === "chậm" ||
      lower === "tts chậm" ||
      lower === "xem tts chậm" ||
      lower === "xem chậm"
    ) {
      const hintMsg = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        text:
          "Bạn muốn xem TTS chậm của kế hoạch nào?\n\n" +
          'Gõ: chậm + tên kế hoạch (ví dụ: tts chậm tháng 12 – trong đó "tháng 12" là tên kế hoạch).',
      };
      setMessages((prev) => [...prev, hintMsg]);
      return true;
    }

    // Nếu không chứa từ "chậm" → không xử lý ở đây
    if (!lower.includes("chậm")) return false;

    // Tách keyword sau từ "chậm" (lấy lần xuất hiện CUỐI cùng)
    const idx = lower.lastIndexOf("chậm");
    let keyword = rawContent.slice(idx + "chậm".length).trim();

    if (!keyword) {
      const hintMsg = {
        id: Date.now() + 2,
        sender: "ai",
        type: "text",
        text:
          "Bạn muốn xem TTS chậm của kế hoạch nào?\n\n" +
          'Gõ: chậm + tên kế hoạch (ví dụ: tts chậm tháng 12 – trong đó "tháng 12" là tên kế hoạch).',
      };
      setMessages((prev) => [...prev, hintMsg]);
      return true;
    }

    const overview = buildDelayOverviewByPlan(keyword);

    if (!overview || overview.length === 0) {
      // ✅ Không tìm thấy kế hoạch phù hợp
      const notFoundMsg = {
        id: Date.now() + 3,
        sender: "ai",
        type: "text",
        text:
          "Tên kế hoạch sai kìa, mở to mắt ra nhìn lại giúp bé với 😝\n" +
          "Nhầm lẫn nhỏ của cô/cậu chủ thôi, thử gõ lại tên kế hoạch chính xác hơn nhé 💖",
      };
      setMessages((prev) => [...prev, notFoundMsg]);
      return true;
    }

    const aiMsg = {
      id: Date.now() + 4,
      sender: "ai",
      type: "delayOverview",
      keyword: keyword,
      overview,
    };

    setMessages((prev) => [...prev, aiMsg]);
    return true;
  };

  // ================== GỬI TIN ==================
  const handleSend = async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    const content = raw;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      type: "text",
      text: content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // 🧠 Thử xử lý logic "chậm" ở FE trước
    const handledByDelay = handleDelayQuery(content);
    if (handledByDelay) {
      return;
    }

    // Không phải câu hỏi "chậm" → gửi xuống BE như cũ
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
          <p>
            Đây là danh sách TTS đang <b>chậm tiến độ</b> trong các kế hoạch
            khớp với: <b>"{m.keyword}"</b>
          </p>

          {m.overview.map((plan) => {
            const maxDelay =
              plan.interns && plan.interns.length
                ? Math.max(
                    ...plan.interns.map((i) => Number(i.delayDays || 0))
                  )
                : 0;

            return (
              <div key={plan.planId} className="ai-plan-block">
                <div className="ai-plan-heading">
                  <span className="ai-pill">Kế hoạch</span>
                  <span className="ai-plan-name">{plan.planName}</span>
                  <span className="ai-plan-count">
                    {plan.interns.length} bạn chậm
                  </span>
                </div>

                <div className="ai-delay-summary">
                  ⏱ Chậm nhất: <b>{maxDelay}</b> ngày
                </div>

                <div className="ai-table-wrapper">
                  <table className="ai-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên TTS</th>
                        <th>Môn hiện tại</th>
                        <th>Số ngày TT</th>
                        <th>Ngày chậm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.interns.map((intern, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{intern.name}</td>
                          <td>{intern.currentCourseName}</td>
                          <td>{intern.trainingDays}</td>
                          <td
                            className={
                              intern.delayDays > 0 ? "ai-delay-cell" : ""
                            }
                          >
                            {intern.delayDays > 0 ? (
                              <span className="ai-delay-badge">
                                {intern.delayDays}
                              </span>
                            ) : (
                              intern.delayDays
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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
