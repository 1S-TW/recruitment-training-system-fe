// Sidebar.jsx (Pure CSS + Router Links)
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Award,
  MessageCircle,
} from "lucide-react";

const menu = [
  { icon: LayoutDashboard, label: "Tổng quan",   path: "/" },
  { icon: Users,            label: "Học viên",   path: "/students" },
  { icon: BookOpen,         label: "Khóa học",   path: "/courses" },
  { icon: Calendar,         label: "Lịch học",   path: "/schedule" },
  { icon: Award,            label: "Chứng chỉ",  path: "/certificates" },
  { icon: MessageCircle,    label: "Tin nhắn",   path: "/messages" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar__logo">
        <div className="brand">
          <div className="brand__mark"><span>LMS</span></div>
          <div>
            <div className="brand__title">LMS</div>
            <div className="brand__subtitle">Hệ thống quản lý đào tạo</div>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="nav">
        {menu.map((item, i) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={i}
              to={item.path}
              className={`nav__item ${active ? "nav__item--active" : ""}`}
            >
              <Icon size={20} />
              <span className="nav__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
