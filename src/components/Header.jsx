// Header.jsx (pure CSS)
import { Bell, Sun, Moon, User, LogOut, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {

  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleLogout  = () => setShowConfirm(true);
  const cancelLogout  = () => setShowConfirm(false);
  const confirmLogout = () => {
    setShowConfirm(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <header className="header">
        <div className="header__left">
        </div>

        <div className="header__right">
          
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
              <button onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
                }} className="btn btn--primary">Đăng xuất</button>
            </div>
          </div>
        </>
      )}
      {showToast && <div className="toast"><Check size={18}/> Đã đăng xuất</div>}
    </>
  );
}