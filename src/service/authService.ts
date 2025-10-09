import type {
  IRegisterPayload,
  IRegisterResponse,
  ILoginPayload,
  ILoginResponse,
  ILoginRefreshResponse,
} from "../types/auth";

const USERS_KEY = "users";
const TOKEN_KEY = "tokens";

interface IUserData extends IRegisterResponse {
  password: string;
}

export const authService = {
  async register(payload: IRegisterPayload): Promise<IRegisterResponse> {
    const users: IUserData[] = JSON.parse(
      localStorage.getItem(USERS_KEY) || "[]"
    );

    if (users.some((u) => u.email === payload.email)) {
      throw new Error("Email sudah terdaftar");
    }

    const newUserWithPassword: IUserData = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUserWithPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // return tanpa password
    return {
      id: newUserWithPassword.id,
      name: newUserWithPassword.name,
      email: newUserWithPassword.email,
      createdAt: newUserWithPassword.createdAt,
      updatedAt: newUserWithPassword.updatedAt,
    };
  },

  async login(payload: ILoginPayload): Promise<ILoginResponse> {
    const users: IUserData[] = JSON.parse(
      localStorage.getItem(USERS_KEY) || "[]"
    );
    const user = users.find(
      (u) => u.email === payload.email && u.password === payload.password
    );

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const tokens: ILoginResponse = {
      accessToken: crypto.randomUUID(),
      refreshToken: crypto.randomUUID(),
    };

    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    );

    return tokens;
  },

  async refreshToken(): Promise<ILoginRefreshResponse> {
    const tokens = JSON.parse(
      localStorage.getItem(TOKEN_KEY) || "{}"
    ) as ILoginResponse;

    if (!tokens.refreshToken) {
      throw new Error("Token tidak ditemukan");
    }

    const newTokens: ILoginRefreshResponse = {
      accessToken: crypto.randomUUID(),
      refreshToken: crypto.randomUUID(),
    };

    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));
    return newTokens;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  updateUser(id: string, newName: string): void {
    const users: IRegisterResponse[] = JSON.parse(
      localStorage.getItem("users") || "[]"
    );
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
      users[index].name = newName;
      users[index].updatedAt = new Date();

      localStorage.setItem("users", JSON.stringify(users));

      // update user aktif juga
      const currentUser: IRegisterResponse | null = JSON.parse(
        localStorage.getItem("user") || "null"
      );
      if (currentUser && currentUser.id === id) {
        currentUser.name = newName;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    }
  },
};
