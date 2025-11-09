import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  // Lấy năm hiện tại một cách tự động
  const currentYear = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <Container>
        <p className="mb-0">
          &copy; {currentYear} Aristotle Training System. All rights reserved.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;