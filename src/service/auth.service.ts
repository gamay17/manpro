
import type {
  IRegisterPayload,
  IRegisterResponse,
  ILoginPayload,
  ILoginResponse,
  ILoginRefreshResponse,
} from "../types/auth";
import { nowLocalDatetime } from "../utils/datetime";


const NS = "auth";
const USERS_KEY = `${NS}:users`;
const TOKEN_KEY = `${NS}:tokens`;
const CURRENT_USER_KEY = `${NS}:user`;


type ISO = string;

interface IUserData extends IRegisterResponse {
  
  password: string;
}

export type Tokens = ILoginResponse & {
  
  accessTokenExp: number;
  
  refreshTokenExp: number;
};


const ACCESS_TTL = 15 * 60;         // 15 menit
const REFRESH_TTL = 7 * 24 * 3600;  // 7 hari


const nowMs = () => Date.now();
const toEpoch = (ms: number) => Math.floor(ms / 1000);
const ms = (s: number) => s * 1000;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
function genUUID() {
  return crypto.randomUUID?.() ?? (Math.random().toString(36).slice(2) + Date.now());
}
function issueTokens(): Tokens {
  const now = nowMs();
  return {
    accessToken: genUUID(),
    refreshToken: genUUID(),
    accessTokenExp: toEpoch(now + ms(ACCESS_TTL)),
    refreshTokenExp: toEpoch(now + ms(REFRESH_TTL)),
  };
}


export const authService = {
  async register(payload: IRegisterPayload): Promise<IRegisterResponse> {
    const users = readJSON<IUserData[]>(USERS_KEY, []);
    if (users.some(u => u.email === payload.email)) {
      throw new Error("Email already exists.");
    }

    const now: ISO = nowLocalDatetime();
    const newUser: IUserData = {
      id: genUUID(),
      name: payload.name,
      email: payload.email,
      password: payload.password, 
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    writeJSON(USERS_KEY, users);

    const { id, name, email, createdAt, updatedAt } = newUser;
    return { id, name, email, createdAt, updatedAt };
  },

  async login(payload: ILoginPayload): Promise<ILoginResponse> {
    const users = readJSON<IUserData[]>(USERS_KEY, []);
    const user = users.find(u => u.email === payload.email && u.password === payload.password);
    if (!user) throw new Error("Incorrect email or password.");

    const tokens = issueTokens();
    writeJSON(TOKEN_KEY, tokens);
    writeJSON(CURRENT_USER_KEY, {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  async refreshToken(): Promise<ILoginRefreshResponse> {
    const tokens = readJSON<Tokens | null>(TOKEN_KEY, null);
    if (!tokens?.refreshToken) throw new Error("Token not found.");

    const now = toEpoch(nowMs());
    if (tokens.refreshTokenExp <= now) {
      this.logout();
      throw new Error("Refresh token expired.");
    }


    const next: Tokens = {
      ...tokens,
      accessToken: genUUID(),
      accessTokenExp: toEpoch(nowMs() + ms(ACCESS_TTL)),
    };
    writeJSON(TOKEN_KEY, next);

    return { accessToken: next.accessToken, refreshToken: next.refreshToken };
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  
  getTokens(): Tokens | null {
    return readJSON<Tokens | null>(TOKEN_KEY, null);
  },
  isAuthenticated(): boolean {
    const t = this.getTokens();
    return !!t && t.accessTokenExp > toEpoch(nowMs());
  },
  me(): IRegisterResponse | null {
    return readJSON<IRegisterResponse | null>(CURRENT_USER_KEY, null);
  },

  updateUser(id: string, data: { name?: string; email?: string }): void {
    const users = readJSON<IUserData[]>(USERS_KEY, []);
    const i = users.findIndex(u => u.id === id);
    if (i === -1) return;

    const updatedAt = nowLocalDatetime();
    if (data.name) users[i].name = data.name;
    if (data.email) users[i].email = data.email;
    users[i].updatedAt = updatedAt;
    writeJSON(USERS_KEY, users);

    const me = this.me();
    if (me?.id === id) {
      writeJSON(CURRENT_USER_KEY, { ...me, ...data, updatedAt });
    }
  },

  updatePassword(id: string, oldPassword: string, newPassword: string): void {
    const users = readJSON<IUserData[]>(USERS_KEY, []);
    const i = users.findIndex(u => u.id === id);
    if (i === -1) throw new Error("User not found.");
    if (users[i].password !== oldPassword) throw new Error("Old password does not match.");

    users[i].password = newPassword;
    users[i].updatedAt = nowLocalDatetime();
    writeJSON(USERS_KEY, users);
  },
};
