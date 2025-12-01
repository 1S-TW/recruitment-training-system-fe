// src/pages/HomePage.jsx
import React from "react";
import Layout from "../components/Layout";
import "../styles/layout.css";
import "../styles/HomePage.css";

function HomePage() {

  return (
     <Layout>
      <div className="home-page">
        <h1>Welcome to the Recruitment and Training Management System</h1>
      
      <div className="home-page fade-slide">

        {/* --- TAB HEADER --- */}
        <div className="dashboard-tabs">
          <div className="tab active">
            CHỈ SỐ 
          </div>
          <div className="tab">
            BIỂU ĐỒ 
          </div>
          <div className="tab">
            THỐNG KÊ TĂNG TRƯỞNG 
          </div>
        </div>

        {/* --- TITLE --- */}
        <h2 className="dashboard-title">
          Kết quả đào tạo 
        </h2>

        {/* --- FILTER BUTTONS --- */}
        <div className="filter-buttons">
          <button className="filter active">Theo tháng </button>
          <button className="filter">Theo quý </button>
          <button className="filter">Theo năm </button>
          <button className="filter">Tất cả </button>
        </div>

      </div>
      </div>
    </Layout>
  );
}

export default HomePage;
