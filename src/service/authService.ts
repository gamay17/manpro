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
      throw new Error("Email already exists.");
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

    // Return without password
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
      throw new Error("Incorrect email or password.");
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
      throw new Error("Token not found.");
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

  updateUser(id: string, data: { name?: string; email?: string }): void {
    const users: IRegisterResponse[] = JSON.parse(
      localStorage.getItem("users") || "[]"
    );
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
      if (data.name) users[index].name = data.name;
      if (data.email) users[index].email = data.email;
      users[index].updatedAt = new Date();

      localStorage.setItem("users", JSON.stringify(users));

      const currentUser: IRegisterResponse | null = JSON.parse(
        localStorage.getItem("user") || "null"
      );
      if (currentUser && currentUser.id === id) {
        if (data.name) currentUser.name = data.name;
        if (data.email) currentUser.email = data.email;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    }
  },

  updatePassword(id: string, oldPassword: string, newPassword: string): void {
    const users: IUserData[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error("User not found.");
    }

    if (users[index].password !== oldPassword) {
      throw new Error("Old password does not match.");
    }

    users[index].password = newPassword;
    users[index].updatedAt = new Date();

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
};
