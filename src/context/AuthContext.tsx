import { createContext } from "react";


type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
};

// hanya context, tanpa provider
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
