import React, { useState, useEffect, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { authService } from "../service/authService";
import type { IRegisterResponse } from "../types/auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IRegisterResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("tokens");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser) as IRegisterResponse);
      const parsedToken = JSON.parse(storedToken);
      setToken(parsedToken.accessToken);
    }
    setLoading(false);
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    const newUser = await authService.register({ name, email, password });
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const result = await authService.login({ email, password });

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setToken(result.accessToken);
  };

  const logout = (): void => {
    authService.logout();
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const updateUser = (data: { name?: string; email?: string }): void => {
    if (!user) return;


    authService.updateUser(user.id, data);

    const updatedUser = JSON.parse(localStorage.getItem("user") || "null") as IRegisterResponse | null;

    if (updatedUser) {
      setUser(updatedUser); 
    } else {
      const merged = { ...user, ...data };
      setUser(merged);
      localStorage.setItem("user", JSON.stringify(merged));
    }
  };

  const updatePassword = (oldPassword: string, newPassword: string): void => {
    if (!user) return;
    authService.updatePassword(user.id, oldPassword, newPassword);
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, updateUser, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
