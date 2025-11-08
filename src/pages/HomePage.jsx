// src/pages/HomePage.jsx
import React from "react";
import Layout from "../components/Layout.jsx";  // ✅ đã sửa
import "../styles/layout.css";

function HomePage() {
  return (
    <Layout>
      <h1>Welcome to the Dashboard</h1>
    </Layout>
  );
}

export default HomePage;
