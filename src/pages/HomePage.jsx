import React, { useState } from "react"; // Chỉ giữ lại 1 lần import, có thêm useState
import Layout from "../components/Layout";
import "../styles/layout.css";
import "../styles/HomePage.css";

function HomePage() {
  // Lấy năm hiện tại
  const currentYear = new Date().getFullYear();
  
  // 1. STATE CHO TAB LỚN (CHỈ SỐ, BIỂU ĐỒ, ...)
  const [activeTab, setActiveTab] = useState("CHỈ SỐ");

  // 2. STATE CHO TAB NHỎ (THEO THÁNG, THEO QUÝ, ...)
  const [activeFilter, setActiveFilter] = useState("Theo tháng"); 
  
  // Danh sách các tùy chọn
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const quarters = [1, 2, 3, 4];
  const years = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => 2010 + i).reverse(); 
  
  // STATE ĐỂ LƯU THÁNG/QUÝ/NĂM ĐANG CHỌN
  // Đặt giá trị khởi tạo là 0 (hoặc null) để force người dùng phải chọn
  const [selectedMonth, setSelectedMonth] = useState(1); 
  const [selectedQuarter, setSelectedQuarter] = useState(0); 
  const [selectedYear, setSelectedYear] = useState(currentYear); 

  // Xử lý khi chọn Tháng/Quý
  const handleFilterChange = (type, value) => {
      // ⚠️ Logic Tự động BẬT/TẮT (Unlock)
      // Khi chọn Tháng, reset Quý và Ngược lại.

      if (type === 'month') {
          setSelectedMonth(value);
          // ⚠️ Khi chọn tháng, phải reset quý để chỉ dùng 1 bộ lọc
          if (value !== 0) {
            setSelectedQuarter(0); 
          }
      } else if (type === 'quarter') {
          setSelectedQuarter(value);
          // ⚠️ Khi chọn quý, phải reset tháng để chỉ dùng 1 bộ lọc
          if (value !== 0) {
            setSelectedMonth(0);
          }
      } else if (type === 'year') {
          setSelectedYear(value);
      }
  }

  // Hàm kiểm tra xem Select có bị khóa (disabled) hay không
  const isMonthDisabled = activeFilter === 'Theo quý' || activeFilter === 'Theo năm' || activeFilter === 'Tất cả';
  const isQuarterDisabled = activeFilter === 'Theo tháng' || activeFilter === 'Theo năm' || activeFilter === 'Tất cả';
  const isYearDisabled = activeFilter === 'Tất cả';
  
  // ⭐️ THÊM MỚI: Danh sách tiêu đề và biểu tượng cho các chỉ số
const metricLabels = [
  { label: "Số thực tập sinh nhập học", icon: "🧑‍💻" },
  { label: "Số thực tập sinh tốt nghiệp", icon: "🎓" },
  { label: "Số thực tập sinh Fail", icon: "❌" },
  { label: "Tỷ lệ Pass/Fail", icon: "📊" },
  { label: "Số thực tập sinh đang thực tập", icon: "💼" },
  { label: "Số thực tập sinh nghỉ thực tập", icon: "🚪" },
  { label: "Điểm tốt nghiệp trung bình", icon: "⭐" },
];

  return (
     <Layout>
      <div className="home-page">
        <h1>Chào mừng bạn đến với trang quản trị</h1>
      
      <div className="home-page fade-slide">

        {/* --- TAB HEADER LỚN --- */}
        <div className="dashboard-tabs">
          
          {/* Tab CHỈ SỐ */}
          <div 
              className={`tab ${activeTab === "CHỈ SỐ" ? "active" : ""}`} 
              onClick={() => setActiveTab("CHỈ SỐ")} 
            >
              CHỈ SỐ 
            </div>

            {/* Tab BIỂU ĐỒ */}
            <div 
              className={`tab ${activeTab === "BIỂU ĐỒ" ? "active" : ""}`}
              onClick={() => setActiveTab("BIỂU ĐỒ")} 
            >
              BIỂU ĐỒ 
            </div>

            {/* Tab THỐNG KÊ TĂNG TRƯỞNG */}
            <div 
              className={`tab ${activeTab === "THỐNG KÊ TĂNG TRƯỞNG" ? "active" : ""}`}
              onClick={() => setActiveTab("THỐNG KÊ TĂNG TRƯỞNG")} 
            >
              THỐNG KÊ TĂNG TRƯỞNG 
            </div>
          </div>
          
          {/* --- NỘI DUNG CHỈ SỐ (Conditional Rendering) --- */}
          {activeTab === "CHỈ SỐ" && ( 
            <div className="tab-content">
              <h2>Kết quả đào tạo</h2> 
              
              {/* --- TAB HEADER NHỎ (Theo tháng, Theo quý, ...) --- */}
              <div className="dashboard-filters"> 
                {
                  ["Theo tháng", "Theo quý", "Theo năm", "Tất cả"].map((filter) => (
                    <div
                      key={filter}
                      className={`filter-tab ${activeFilter === filter ? "active-filter" : ""}`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </div>
                  ))
                }
              </div>

              {/* --- KHUNG CHỌN LỌC (SELECT BOXES) --- */}
              <div className="filter-options">
                
                {/* 1. CHỌN THÁNG (Chỉ hiện khi Theo tháng đang active) */}
                <select 
                    value={selectedMonth} 
                    onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
                    // Bị disabled khi không phải tab 'Theo tháng'
                    disabled={isMonthDisabled}
                    className={isMonthDisabled ? 'disabled-select' : ''}
                >
                  <option value={0} disabled>Chọn tháng</option>
                  {months.map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>

                {/* 2. CHỌN QUÝ (Chỉ hiện khi Theo quý đang active) */}
                <select 
                  value={selectedQuarter} 
                  onChange={(e) => handleFilterChange('quarter', parseInt(e.target.value))}
                  // Bị disabled khi không phải tab 'Theo quý'
                  disabled={isQuarterDisabled}
                  className={isQuarterDisabled ? 'disabled-select' : ''}
                >
                  <option value={0} disabled>Chọn quý</option>
                  {quarters.map(q => (
                    <option key={q} value={q}>Quý {q}</option>
                  ))}
                </select>

                {/* 3. CHỌN NĂM */}
                <select 
                    value={selectedYear} 
                    onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                    disabled={isYearDisabled} // ⬅️ Dùng biến đã sửa ở trên
                    className={isYearDisabled ? 'disabled-select' : ''}
                >
                    <option value={0} disabled>Chọn năm</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                
              </div> {/* /filter-options */}

             {/* KHUNG TÓM TẮT BỘ LỌC */}
              <div className="filter-summary">
                
                <p style={{ fontWeight: 'bold' }}>
                    {activeFilter === 'Theo tháng' && selectedMonth > 0 && <span> Tháng {selectedMonth} Năm {selectedYear}</span>}
                    {activeFilter === 'Theo quý' && selectedQuarter > 0 && <span> Quý {selectedQuarter} Năm {selectedYear}</span>}
                    {activeFilter === 'Theo năm' && <span>Đang lọc theo: Năm {selectedYear}</span>}
                    {activeFilter === 'Tất cả' && <span>Tất cả dữ liệu</span>}
                    
                    {/* Thông báo nếu chưa chọn tháng/quý */}
                    {((activeFilter === 'Theo tháng' && selectedMonth === 0) || (activeFilter === 'Theo quý' && selectedQuarter === 0)) && <span>Vui lòng chọn giá trị lọc.</span>}
                </p>
              </div>
              
              {/* KHUNG HIỂN THỊ CÁC CHỈ SỐ KPI (metrics-grid) */}
              <div className="metrics-grid">
                  {metricLabels.map((metric, index) => (
                      <div key={index} className="metric-card">
                          <span className="metric-label">
                            <span className="icon">{metric.icon}</span> 
                            {metric.label}
                          </span>
                          <div className="metric-value-wrapper">
                              {/* PLACEHOLDER */}
                              <span className="metric-value">--</span>
                              <span className="metric-unit">/ --</span>
                          </div>
                      </div>
                  ))}
                  {/* Thêm một card rỗng để lấp đầy khoảng trống (nếu số lượng lẻ) */}
                  {metricLabels.length % 2 !== 0 && (
                      <div className="metric-card" style={{ visibility: 'hidden' }}></div>
                  )}
            </div>
              
            </div>
          )} {/* /Conditional Rendering */}

        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
