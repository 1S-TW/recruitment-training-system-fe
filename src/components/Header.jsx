// src/components/Header.jsx
import { Bell, User, LogOut, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { getNotifications, markAsRead } from "../services/notificationService";
import api from "../services/api"; // baseURL: http://localhost:8080/api

export default function Header() {
  const [isDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("all");

  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const bellRef = useRef(null);
  const userRef = useRef(null);

  // ===== Theme =====
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // ===== Logout =====
  const handleLogout = () => setShowConfirm(true);
  const cancelLogout = () => setShowConfirm(false);
  const confirmLogout = () => {
    setShowConfirm(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    logoutUser();
    window.location.href = "/login";
  };

  // ===== Load notifications =====
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ===== Click outside =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  const extractQuotedText = (text = "") => {
    const match = text.match(/"([^"]+)"/);
    return match ? match[1] : "";
  };

  /**
   * Các loại thông báo xử lý được chỉ bằng title/content
   * (requestTitle nằm trong dấu ngoặc kép)
   */
  const getNotificationTarget = (notification = {}) => {
    const { eventType } = notification;
    const combinedText = `${notification.title || ""} ${
      notification.content || ""
    }`.toLowerCase();

    // ===== Nhu cầu nhân sự: tạo / duyệt / từ chối -> sang Nhu cầu + mở modal =====
    if (
      eventType === "HR_REQUEST_CREATED" ||
      eventType === "HR_REQUEST_APPROVED" ||
      eventType === "HR_REQUEST_REJECTED" ||
      combinedText.includes("nhu cầu nhân sự mới") ||
      combinedText.includes("nhu cầu nhân sự đã được duyệt") ||
      combinedText.includes("nhu cầu nhân sự bị từ chối")
    ) {
      const requestTitle =
        extractQuotedText(notification.content || notification.title) || "";
      if (!requestTitle) return { path: "/recruitment/needs" };

      const query = new URLSearchParams({ requestTitle }).toString();
      return { path: `/recruitment/needs?${query}` };
    }

    // ===== Kế hoạch tuyển dụng mới -> sang Kế hoạch (mở chi tiết kế hoạch) =====
    if (
      eventType === "PLAN_CREATED" ||
      combinedText.includes("kế hoạch tuyển dụng mới")
    ) {
      const planName =
        extractQuotedText(notification.content || notification.title) || "";
      if (!planName) return { path: "/recruitment/plan" };

      const query = new URLSearchParams({ planName }).toString();
      return { path: `/recruitment/plan?${query}` };
    }

    // PLAN_CONFIRMED / PLAN_REJECTED xử lý riêng bằng referenceId
    if (
      eventType === "PLAN_CONFIRMED" ||
      eventType === "PLAN_REJECTED" ||
      combinedText.includes("kế hoạch tuyển dụng đã được duyệt") ||
      combinedText.includes("kế hoạch tuyển dụng bị từ chối")
    ) {
      return null;
    }

    return null;
  };

  /**
   * Riêng PLAN_CONFIRMED / PLAN_REJECTED:
   *  - Dùng referenceType = "RECRUITMENT_PLAN" + referenceId = planId
   *  - GET /api/recruitment-plans/{planId} lấy request.requestTitle
   *  - Navigate sang /recruitment/needs?requestTitle=...
   */
  const openRequestFromPlanNotification = async (notification) => {
    const { referenceType, referenceId } = notification;

    if (referenceType !== "RECRUITMENT_PLAN" || !referenceId) {
      navigate("/recruitment/needs");
      return;
    }

    try {
      const res = await api.get(`/recruitment-plans/${referenceId}`);
      const plan = res.data;
      const requestTitle = plan?.request?.requestTitle || "";

      if (requestTitle) {
        const query = new URLSearchParams({ requestTitle }).toString();
        navigate(`/recruitment/needs?${query}`, {
          state: {
            fromNotification: "PLAN_TO_REQUEST",
            requestTitle,
          },
        });
      } else {
        navigate("/recruitment/needs");
      }
    } catch (err) {
      console.error("Không lấy được kế hoạch từ notification:", err);
      navigate("/recruitment/needs");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );

      // Ưu tiên: PLAN_CONFIRMED / PLAN_REJECTED -> sang Nhu cầu + mở modal nhu cầu
      if (
        notification.eventType === "PLAN_CONFIRMED" ||
        notification.eventType === "PLAN_REJECTED"
      ) {
        await openRequestFromPlanNotification(notification);
        setShowBell(false);
        return;
      }

      const target = getNotificationTarget(notification);
      if (target) {
        navigate(target.path, { state: target.state });
      }

      setShowBell(false);
    } catch (error) {
      console.error("Failed to handle notification click", error);
    }
  };

  const listToRender =
    activeTab === "unread" ? unreadNotifications : notifications;

  return (
    <>
      <header className="header">
        <div className="header__left"></div>

        <div className="header__right">
          {user?.role && (
            <div className="header__greeting">Chào {user.role}</div>
          )}

          {/* ==== Chuông thông báo ==== */}
          <div className="dropdown" ref={bellRef}>
            <button
              className="icon-btn notification__btn"
              onClick={() => setShowBell((s) => !s)}
              aria-label="notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notification__badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showBell && (
              <div className="dropdown__menu notification__menu">
                <div className="notification__header">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="notification__pill notification__pill--ghost">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div className="notification__tabs">
                  <button
                    type="button"
                    className={`notification__tab ${
                      activeTab === "all" ? "notification__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`notification__tab ${
                      activeTab === "unread" ? "notification__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("unread")}
                  >
                    Chưa đọc
                    {unreadCount > 0 && (
                      <span className="notification__tab-count">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Nội dung */}
                {listToRender.length === 0 ? (
                  <div className="notification__empty">
                    {activeTab === "unread"
                      ? "Không có thông báo chưa đọc"
                      : "Chưa có thông báo"}
                  </div>
                ) : (
                  <div className="notification__list">
                    {listToRender.map((n) => {
                      const timestamp = n.createdAt
                        ? new Date(n.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour12: false,
                          })
                        : "";

                      const isUnread = !n.read;

                      return (
                        <div
                          key={n.id}
                          className={`notification__item ${
                            isUnread ? "notification__item--unread" : ""
                          }`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <span
                            className={`notification__dot ${
                              isUnread ? "" : "notification__dot--muted"
                            }`}
                            aria-hidden
                          />
                          <div className="notification__body">
                            <div className="notification__title">
                              {n.title}
                            </div>
                            <div className="notification__content">
                              {n.content}
                            </div>
                            {timestamp && (
                              <div className="notification__meta">
                                <span className="notification__time">
                                  {timestamp}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==== Avatar user ==== */}
          <div className="dropdown" ref={userRef}>
            <button
              className="avatar"
              onClick={() => setShowDropdown((s) => !s)}
              aria-label="user"
            >
              <User size={18} />
            </button>
            {showDropdown && (
              <div className="dropdown__menu">
                <div className="dropdown__item" onClick={handleLogout}>
                  <LogOut size={18} /> Đăng xuất
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal confirm logout */}
      {showConfirm && (
        <>
          <div className="backdrop" onClick={cancelLogout} />
          <div className="modal">
            <h3 className="modal__title">Xác nhận đăng xuất</h3>
            <p className="modal__text">Bạn có chắc chắn muốn đăng xuất?</p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: ".5rem",
              }}
            >
              <button onClick={cancelLogout} className="btn">
                Hủy
              </button>
              <button onClick={confirmLogout} className="btn btn--primary">
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {showToast && (
        <div className="toast">
          <Check size={18} /> Đã đăng xuất
        </div>
      )}
    </>
  );
}
