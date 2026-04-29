import http from './http'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login: (params: LoginParams) => http.post<any, AuthTokens>('/auth/login', params),
  register: (params: RegisterParams) => http.post<any, AuthTokens>('/auth/register', params),
  refresh: (refreshToken: string) =>
    http.post<any, AuthTokens>('/auth/refresh', {}, { headers: { Authorization: `Bearer ${refreshToken}` } } as any),
  logout: () => http.post('/auth/logout')
}
