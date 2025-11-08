import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
} from "lucide-react";
import { useState } from "react";

const menu = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Đào tạo", path: "/training" },
  {
    icon: Users,
    label: "Tuyển dụng",
    path: "/recruitment",
    submenu: [
      { label: "Nhu cầu nhân sự", path: "/recruitment/needs" },
      { label: "Kế hoạch tuyển dụng", path: "/recruitment/plan" },
      { label: "Phỏng vấn", path: "/recruitment/interview" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="brand">
          <div className="brand__mark"><span>LMS</span></div>
          <div>
            <div className="brand__title">LMS</div>
            <div className="brand__subtitle">Hệ thống quản lý đào tạo</div>
          </div>
        </div>
      </div>

      <nav className="nav">
        {menu.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
                           (item.submenu && location.pathname.startsWith(item.path));
          const isSubmenuOpen = item.submenu && (openSubmenu === item.label || location.pathname.startsWith(item.path));

          return (
            <div key={i}>
              {/* Nếu có submenu → click mở/đóng, nếu không → Link điều hướng */}
              {item.submenu ? (
                <div
                  className={`nav__item ${isActive ? "nav__item--active" : ""}`}
                  onClick={() => toggleSubmenu(item.label)}
                  style={{ cursor: "pointer" }}
                >
                  <Icon size={20} />
                  <span className="nav__label">{item.label}</span>
                  <span className="nav__arrow">{isSubmenuOpen ? "▲" : "▼"}</span>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`nav__item ${isActive ? "nav__item--active" : ""}`}
                >
                  <Icon size={20} />
                  <span className="nav__label">{item.label}</span>
                </Link>
              )}

              {/* Hiển thị submenu nếu đang mở */}
              {item.submenu && isSubmenuOpen && (
                <div className="nav__submenu">
                  {item.submenu.map((sub, j) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={j}
                        to={sub.path}
                        className={`nav__item nav__item--sub ${subActive ? "nav__item--active" : ""}`}
                      >
                        <span className="nav__label">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
