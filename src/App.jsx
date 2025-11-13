import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext';
import Notification from './components/Notification/Notification';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import './styles/style.css'; // Import CSS toàn cục

function App() {
  return (

    <AuthProvider>
    {/* 1. Bọc toàn bộ App trong NotificationProvider*/}
    <NotificationProvider>

      {/* 2. Đặt component Notification ở đây để nó hiển thị trên mọi trang */}
      <Notification />

      {/* 3. Render các routes của bạn */}
      <AppRoutes />

    </NotificationProvider>
    </AuthProvider>
  );
}

export default App;