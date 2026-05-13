import React, { createContext, useState, useContext, useMemo } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("iyf_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData) => {
    const nextUser = {
      id: userData.id || crypto.randomUUID(),
      name: userData.name || userData.email?.split("@")[0] || "IYF User",
      email: userData.email,
      role: userData.role || "attendee",
      token: userData.token || `demo-token-${Date.now()}`,
    };

    setUser(nextUser);
    localStorage.setItem("iyf_user", JSON.stringify(nextUser));
    localStorage.setItem("token", nextUser.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("iyf_user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = Boolean(user);
  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
