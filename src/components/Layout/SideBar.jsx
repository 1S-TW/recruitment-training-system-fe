import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

// (Bạn có thể thêm icon từ react-icons: npm install react-icons)
// import { FaUsers } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <Nav className="admin-sidebar" defaultActiveKey="/admin/user-management">
      {/* Dùng NavLink của react-router-dom để nó tự động
        thêm class 'active' khi URL trùng khớp
      */}
      <NavLink 
        to="/admin/user-management" 
        className="nav-link"
      >
        {/* <FaUsers style={{ marginRight: '10px' }} /> */}
        Quản lý Tài khoản
      </NavLink>
      
      {/* (Ví dụ khi thêm link mới sau này)
        <NavLink to="/admin/course-management" className="nav-link">
          Quản lý Khóa học
        </NavLink>
      */}
    </Nav>
  );
};

export default Sidebar;