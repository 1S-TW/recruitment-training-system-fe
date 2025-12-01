// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, UserCog } from "lucide-react"; // ✅ Thêm icon UserCog
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // ✅ Bật lại AuthContext để check quyền

export default function Sidebar() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  // ✅ Lấy role của user đang đăng nhập
  const { user } = useAuth();
  const role = user?.role;

  const baseMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    
    // 👇 MỤC MỚI: QUẢN LÝ TÀI KHOẢN (Chỉ SUPER_ADMIN thấy)
    { 
      icon: UserCog, 
      label: "Quản lý tài khoản", 
      path: "/admin/users",
      requiredRole: "SUPER_ADMIN" 
    },

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

  // Lọc menu dựa trên Role
  const filteredMenu = baseMenu.map(item => {
    // 1. Nếu menu yêu cầu role mà user không có -> ẩn đi
    if (item.requiredRole && item.requiredRole !== role) {
      return null;
    }

    // 2. Xử lý Submenu
    if (item.submenu) {
      // Giữ nguyên submenu
      return item;
    }

    return item;
  }).filter(Boolean); // Loại bỏ các item null

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