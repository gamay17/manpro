import React, { useState, useEffect, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { authService } from "../service/authService";
import type { IRegisterResponse } from "../types/auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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

    console.log("HASIL LOGIN:", result);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setToken(result.accessToken);

    console.log("USER DISIMPAN:", localStorage.getItem("user"));
  };

  const logout = (): void => {
    authService.logout();
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const updateUser = (newName: string): void => {
    if (!user) return;

    authService.updateUser(user.id, newName);

    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);

    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
