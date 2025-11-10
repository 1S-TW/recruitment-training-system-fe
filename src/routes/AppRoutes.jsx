// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import HRRequestPage from "../pages/HrRequestPage";
import RecruitmentPlanPage from "../pages/RecruitmentPlanPage"; // Thêm trang mới
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Trang chính */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />

            {/* Trang Nhu cầu nhân sự */}
            <Route
                path="/recruitment/needs"
                element={
                    <ProtectedRoute>
                        <HRRequestPage />
                    </ProtectedRoute>
                }
            />

            {/* Trang Kế hoạch tuyển dụng */}
            <Route
                path="/recruitment/plan"
                element={
                    <ProtectedRoute>
                        <RecruitmentPlanPage />
                    </ProtectedRoute>
                }
            />

            {/* Nếu người dùng nhập sai URL */}
            <Route path="*" element={<LoginPage />} />
        </Routes>
    );
}

export default AppRoutes;
