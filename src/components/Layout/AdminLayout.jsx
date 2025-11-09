import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; 
import Sidebar from './SideBar'; 
import Footer from './Footer'; 
import './Layout.css'; 

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-main-content">
        <Sidebar />
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;