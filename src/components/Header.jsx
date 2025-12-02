// Header.jsx (pure CSS)
import { Bell, User, LogOut, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAsRead } from '../services/notificationService';

export default function Header() {
  const [isDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logoutUser } = useAuth();


  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', isDark);   // ✅ chỉ dùng CSS thuần
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);


  const handleLogout  = () => setShowConfirm(true);
  const cancelLogout  = () => setShowConfirm(false);
  const confirmLogout = () => {
    setShowConfirm(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    logoutUser();
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header__left">
        </div>

        <div className="header__right">

          {user?.role && (
            <div className="header__greeting">Chào {user.role}</div>
          )}

          <div className="dropdown">
            <button
              className="icon-btn notification__btn"
              onClick={() => setShowBell((s) => !s)}
              aria-label="notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification__badge" aria-hidden />}
            </button>
            {showBell && (
              <div className="dropdown__menu notification__menu">
                <div className="notification__header">Thông báo</div>
                {notifications.length === 0 && (
                  <div className="notification__empty">Chưa có thông báo</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notification__item ${n.read ? '' : 'notification__item--unread'}`}
                    onClick={() => handleNotificationClick(n.id)}
                  >
                    <div className="notification__title">{n.title}</div>
                    <div className="notification__content">{n.content}</div>
                    <div className="notification__meta">
                      <span>{n.eventType}</span>
                      {n.createdAt && (
                        <span>
                          {new Date(n.createdAt).toLocaleString('vi-VN', {
                            hour12: false,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown">
            <button className="avatar" onClick={()=>setShowDropdown(s=>!s)} aria-label="user">
              <User size={18} />
            </button>
            {showDropdown && (
              <div className="dropdown__menu">
                <div className="dropdown__item" onClick={handleLogout}><LogOut size={18}/> Đăng xuất</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showConfirm && (
        <>
          <div className="backdrop" onClick={cancelLogout} />
          <div className="modal">
            <h3 className="modal__title">Xác nhận đăng xuất</h3>
            <p className="modal__text">Bạn có chắc chắn muốn đăng xuất?</p>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'.5rem'}}>
              <button onClick={cancelLogout} className="btn">Hủy</button>
              <button onClick={confirmLogout} className="btn btn--primary">Đăng xuất</button>
            </div>
          </div>
        </>
      )}
      {showToast && <div className="toast"><Check size={18}/> Đã đăng xuất</div>}
    </>
  );
}