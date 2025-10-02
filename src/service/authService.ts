import type { User } from "../types/auth";

export const registerUser = (name: string, email: string, password: string) => {
  const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");

  if (users.find((u) => u.email === email)) {
    throw new Error("Email sudah terdaftar!");
  }

  users.push({ name, email, password });
  localStorage.setItem("users", JSON.stringify(users));
};

export const loginUser = (email: string, password: string): User => {
  const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new Error("Email atau password salah!");
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
};

export const getCurrentUser = (): User | null => {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
};

export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};

