import React, { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

const getInitialUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch { 
    console.error("Failed to parse user from localStorage");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);

  const loginUser = (userData) => {
    const { token, ...userDetails } = userData; 
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userDetails)); 
    setUser(userDetails); 
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user, 
    isAuthenticated: !!user, 
    isAdmin: user?.role === 'SUPER_ADMIN', 
    loginUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};