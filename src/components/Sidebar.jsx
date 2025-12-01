// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext"; // ❌ Bỏ dòng này nếu không dùng user

export default function Sidebar() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  // ❌ Bỏ lấy role vì hiện tại sidebar hiển thị full cho mọi người
  // const { user } = useAuth();
  // const role = user?.role;

  const baseMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: BookOpen, label: "Đào tạo", path: "/training" },
    {
      icon: Users,
      label: "Tuyển dụng",
      path: "/recruitment",
      submenu: [
        { label: "Nhu cầu nhân sự", path: "/recruitment/needs" },
        { label: "Kế hoạch tuyển dụng", path: "/recruitment/plan" },
        { label: "Quản lý ứng viên", path: "/recruitment/candidates" },
      ],
    },
  ];

  // Lọc menu (Logic hiện tại là cho phép tất cả, nên chỉ map đơn giản)
  const filteredMenu = baseMenu.map(item => {
    // 1. Module Đào tạo: Giữ nguyên (hiện cho tất cả)
    if (item.path === "/training") {
      return item;
    }

    // 2. Submenu Tuyển dụng
    if (item.submenu) {
      // ❌ Bỏ hàm filter(sub => true) gây lỗi 'sub is defined but never used'
      // Vì không lọc gì cả nên lấy trực tiếp item.submenu
      const newSub = item.submenu;
      
      if (newSub.length === 0) return null;
      return { ...item, submenu: newSub };
    }

    return item;
  }).filter(Boolean);

  useEffect(() => {
    const activeMenu = filteredMenu.find(
      (item) => item.submenu && location.pathname.startsWith(item.path)
    );
    if (activeMenu) {
      setOpenSubmenu(activeMenu.label);
    }
  }, [location.pathname, filteredMenu]);

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="brand">
          <div className="brand__mark"><span>LMS</span></div>
          <div><div className="brand__title">Hệ thống</div></div>
        </div>
      </div>

      <nav className="nav">
        {filteredMenu.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.submenu && location.pathname.startsWith(item.path));
          const isSubmenuOpen = item.submenu && openSubmenu === item.label;

          return (
            <div key={i}>
              {item.submenu ? (
                <div className={`nav__item ${isActive ? "nav__item--active" : ""}`} onClick={() => toggleSubmenu(item.label)} style={{ cursor: "pointer" }}>
                  <Icon size={20} />
                  <span className="nav__label">{item.label}</span>
                  <span className={`nav__arrow ${isSubmenuOpen ? "nav__arrow--open" : ""}`}>▼</span>
                </div>
              ) : (
                <Link to={item.path} className={`nav__item ${isActive ? "nav__item--active" : ""}`}>
                  <Icon size={20} />
                  <span className="nav__label">{item.label}</span>
                </Link>
              )}

              {item.submenu && isSubmenuOpen && (
                <div className="nav__submenu">
                  {item.submenu.map((sub, j) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <Link key={j} to={sub.path} className={`nav__item nav__item--sub ${subActive ? "nav__item--active" : ""}`}>
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