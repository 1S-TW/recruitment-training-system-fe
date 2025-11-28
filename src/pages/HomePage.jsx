
// src/pages/HomePage.jsx
import React from "react";
import Layout from "../components/Layout";
import "../styles/home.css";

function HomePage() {
    return (
        <Layout>
            <main className="home-container">
                <h1 className="home-title">Welcome to the Dashboard</h1>
                <p className="home-subtitle">
                    Manage your data, view reports, and customize your settings.
                </p>

                <div className="home-actions">
                    <Link to="/reports" className="btn btn-primary">
                        View Reports
                    </Link>
                    <Link to="/settings" className="btn btn-secondary">
                        Settings
                    </Link>
                </div>

                <section className="home-summary">
                    <h2>Quick Overview</h2>
                    <div className="cards">
                        <div className="card">
                            <h3>Users</h3>
                            <p>1,245 Active</p>
                        </div>
                        <div className="card">
                            <h3>Sales</h3>
                            <p>$12,340 Today</p>
                        </div>
                        <div className="card">
                            <h3>Tasks</h3>
                            <p>23 Pending</p>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}

export default HomePage;
