import React from 'react';
import ReactDOM from 'react-dom/client'; 
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Import CSS của Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// Import CSS toàn cục
import './styles/global.css';

// Import Context Provider
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Bọc toàn bộ App bằng AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);