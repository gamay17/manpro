

export interface IRegisterPayload {
  name: string
  email: string
  password: string
}

export interface IRegisterResponse {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface ILoginResponse {
  accessToken: string
  refreshToken: string
}

export interface ILoginRefreshResponse {
  accessToken: string
  refreshToken: string
}
