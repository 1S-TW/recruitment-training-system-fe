import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Import AuthContext

export default function Sidebar() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { user } = useAuth(); // Lấy user hiện tại
  const role = user?.role; // Lấy role

  // Định nghĩa menu gốc
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

  // Lọc menu theo Role
  const filteredMenu = baseMenu.map(item => {
    // 1. Xử lý quyền truy cập cấp cao (Item cha)
    // LEAD và HR không được vào Đào tạo
    if (item.path === "/training") {
      if (role === "LEAD" || role === "HR") return null;
    }

    // 2. Xử lý Submenu (Tuyển dụng)
    if (item.submenu) {
      const newSub = item.submenu.filter(sub => {
        // HR: Ẩn "Nhu cầu nhân sự"
        if (role === "HR" && sub.path === "/recruitment/needs") return false;
        // LEAD: Ẩn "Quản lý ứng viên"
        if (role === "LEAD" && sub.path === "/recruitment/candidates") return false;
        return true;
      });
      // Nếu lọc xong mà rỗng thì ẩn luôn item cha, ngược lại cập nhật submenu mới
      if (newSub.length === 0) return null;
      return { ...item, submenu: newSub };
    }

    return item;
  }).filter(Boolean); // Loại bỏ các item null

  // ... (Giữ nguyên phần logic useEffect và toggleSubmenu)
  useEffect(() => {
    const activeMenu = filteredMenu.find(
      (item) => item.submenu && location.pathname.startsWith(item.path)
    );
    if (activeMenu) {
      setOpenSubmenu(activeMenu.label);
    }
  }, [location.pathname, filteredMenu]); // Thêm dependency filteredMenu

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <aside className="sidebar">
      {/* ... (Giữ nguyên phần Logo) ... */}
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