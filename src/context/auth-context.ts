// src/context/auth-context.ts
import { createContext } from "react";
import type { IRegisterResponse } from "../types/auth";

export interface AuthContextType {
  user: IRegisterResponse | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: { name?: string; email?: string }) => void;
  updatePassword: (oldPassword: string, newPassword: string) => void; 
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
