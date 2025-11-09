import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login'); // Điều hướng về trang login sau khi đăng xuất
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="admin-header" fixed="top">
      <Container fluid>
        <Navbar.Brand href="/admin" className="admin-logo">
          {/* Logo Placeholder (Bạn có thể thay bằng file SVG hoặc ảnh) */}
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#0D6EFD" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FFF"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#FFF"/>
          </svg>
          Aristotle Quản lý Đào tạo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Đẩy dropdown sang phải (ms-auto) */}
            <NavDropdown 
              title={`Chào, ${user?.fullName || 'Admin'}`} 
              id="basic-nav-dropdown"
              align="end" // Thả xuống bên trái
            >
              {/* <NavDropdown.Item href="#profile">Hồ sơ</NavDropdown.Item> */}
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Đăng xuất
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;