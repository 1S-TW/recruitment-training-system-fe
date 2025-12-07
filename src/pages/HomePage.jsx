// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/HomePage.css";
import axios from "axios";
import "../styles/layout.css";

function HomePage() {
  const [activeTab, setActiveTab] = useState("chis0");

  const [filterType, setFilterType] = useState("all");
  const [month, setMonth] = useState("1");
  const [quarter, setQuarter] = useState("1");
  const [year, setYear] = useState(new Date().getFullYear());

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [stats, setStats] = useState(null);

  // -------------------------
  //  TÍNH START - END DATE
  // -------------------------
  const calculateRange = () => {
    let start = "";
    let end = "";

    if (filterType === "month") {
      start = `${year}-${month.padStart(2, "0")}-01`;
      end = `${year}-${month.padStart(
        2,
        "0"
      )}-${new Date(year, Number(month), 0).getDate()}`;
    }

    if (filterType === "quarter") {
      const qStart = (quarter - 1) * 3 + 1;
      const qEnd = qStart + 2;

      start = `${year}-${String(qStart).padStart(2, "0")}-01`;
      end = `${year}-${String(qEnd).padStart(
        2,
        "0"
      )}-${new Date(year, qEnd, 0).getDate()}`;
    }

    if (filterType === "year") {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    }

    if (filterType === "all") {
      // phải gửi khoảng ngày hợp lệ, backend mới hiểu
      start = "1900-01-01";
      end = "2100-12-31";
    }

    setDateRange({ start, end });
  };

  useEffect(() => {
    calculateRange();
  }, [filterType, month, quarter, year]);

  // -------------------------
  //      GỌI API BACKEND
  // -------------------------
  const fetchDashboard = async () => {
    try {
let url = `http://localhost:8080/api/dashboard?start=${dateRange.start}&end=${dateRange.end}`;

      console.log("CALL API:", url);

      const token = localStorage.getItem("token");

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DASHBOARD DATA:", res.data);
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard API Error:", err);
    }
  };

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchDashboard();
    }
  }, [dateRange]);

  return (
    <Layout>
      <div className="home-container fade-slide">
        {/* TABS */}
        <div className="tabs">
          <button
            className={activeTab === "chis0" ? "tab active" : "tab"}
            onClick={() => setActiveTab("chis0")}
          >
            Chỉ số
          </button>

          <button
            className={activeTab === "bieu-do" ? "tab active" : "tab"}
            onClick={() => setActiveTab("bieu-do")}
          >
            Biểu đồ
          </button>

          <button
            className={activeTab === "tang-truong" ? "tab active" : "tab"}
            onClick={() => setActiveTab("tang-truong")}
          >
            Thống kê tăng trưởng
          </button>
        </div>

        {/* TAB CHỈ SỐ */}
        {activeTab === "chis0" && (
          <>
            <div className="header-row">
              <h2 className="title">Kết quả đào tạo</h2>
            </div>

            {/* NÚT LỌC */}
            <div className="filter-buttons">
              <button
                className={filterType === "month" ? "f-btn active" : "f-btn"}
                onClick={() => setFilterType("month")}
              >
                Tháng
              </button>
              <button
                className={filterType === "quarter" ? "f-btn active" : "f-btn"}
                onClick={() => setFilterType("quarter")}
              >
                Quý
              </button>
              <button
                className={filterType === "year" ? "f-btn active" : "f-btn"}
                onClick={() => setFilterType("year")}
              >
                Năm
              </button>
              <button
                className={filterType === "all" ? "f-btn active" : "f-btn"}
                onClick={() => setFilterType("all")}
              >
                Tất cả
              </button>
            </div>

            {/* SELECTOR */}
            <div className="selectors">
              {filterType === "month" && (
                <select
                  className="select-control"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              )}

              {filterType === "quarter" && (
                <select
                  className="select-control"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                >
                  <option value="1">Quý 1</option>
                  <option value="2">Quý 2</option>
                  <option value="3">Quý 3</option>
                  <option value="4">Quý 4</option>
                </select>
              )}

              {filterType !== "all" && (
                <select
                  className="select-control"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  {Array.from({ length: 16 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* GRID CHỈ SỐ */}
            <div className="stats-grid">
              <div className="card">
                Số thực tập sinh nhập học: {stats?.totalEnroll ?? 0}
              </div>

              <div className="card">
                Số thực tập sinh tốt nghiệp: {stats?.totalGraduate ?? 0}
              </div>

              <div className="card">
                Số TTS fail: {stats?.totalFail ?? 0}
              </div>

              <div className="card">
                Tỉ lệ pass/fail: {stats?.passFailRate ?? 0}%
              </div>

              <div className="card">
                Số TTS nghỉ thực tập: {stats?.totalQuit ?? 0}
              </div>

              <div className="card">
                Điểm tốt nghiệp trung bình: {stats?.averageFinalScore ?? 0}
              </div>
            </div>
          </>
        )}

        {activeTab === "bieu-do" && (
          <div className="coming-soon">Biểu đồ đang phát triển...</div>
        )}

        {activeTab === "tang-truong" && (
          <div className="coming-soon">Thống kê tăng trưởng đang phát triển...</div>
        )}
      </div>
    </Layout>
  );
}

export default HomePage;
