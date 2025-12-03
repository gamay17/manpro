// src/context/authprovider.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type PropsWithChildren,
} from "react";
import { AuthContext } from "./auth-context";
import { authService, type Tokens } from "../service/auth.service";
import type { IRegisterResponse } from "../types/auth";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<IRegisterResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<number | null>(null);

  // 1) Definisikan handleLogout dulu, karena dipakai di scheduleRefresh
  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  // 2) scheduleRefresh: gunakan tipe Tokens, tidak perlu any
  const scheduleRefresh = useCallback(() => {
    const tokens = authService.getTokens(); // Tokens | null
    if (!tokens) return;

    const exp = (tokens as Tokens).accessTokenExp; // tipe aman
    if (!exp) return;

    const nowMs = Date.now();
    const dueMs = exp * 1000 - nowMs - 30_000; // 30s sebelum kadaluarsa
    const wait = Math.max(5_000, dueMs);

    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const next = await authService.refreshToken();
        setToken(next.accessToken);
        scheduleRefresh();
      } catch {
        handleLogout();
      }
    }, wait);
  }, [handleLogout]); // ✅ tambah dependency yang hilang

  const applySessionFromService = useCallback(() => {
    const me = authService.me();
    const tokens = authService.getTokens();
    if (me && tokens && authService.isAuthenticated()) {
      setUser(me);
      setToken(tokens.accessToken);
      scheduleRefresh();
    } else {
      setUser(null);
      setToken(null);
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    applySessionFromService();
    setLoading(false);

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("auth")) applySessionFromService();
    };
    window.addEventListener("storage", onStorage);

    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, [applySessionFromService, scheduleRefresh]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const newUser = await authService.register({ name, email, password });
      setUser(newUser); // opsional: auto-login → panggil login(email, password)
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await authService.login({ email, password });
      applySessionFromService();
    },
    [applySessionFromService]
  );

  const logout = useCallback(() => handleLogout(), [handleLogout]);

  const updateUser = useCallback(
    (data: { name?: string; email?: string }) => {
      if (!user) return;
      authService.updateUser(user.id, data);
      const me = authService.me();
      if (me) setUser(me);
    },
    [user]
  );

  const updatePassword = useCallback(
    (oldPassword: string, newPassword: string) => {
      if (!user) return;
      authService.updatePassword(user.id, oldPassword, newPassword);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      updatePassword,
    }),
    [user, token, loading, login, register, logout, updateUser, updatePassword]
  );

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
