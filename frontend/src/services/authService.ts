import { API_BASE_URL } from './api'

export interface LoginRequest {
    organizationSlug: string
    email: string
    password: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
}

export async function login(
    credentials: LoginRequest,
): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Empresa, e-mail ou senha inválidos.')
        }

        throw new Error('Não foi possível realizar o login. Tente novamente.')
    }

    const data: AuthResponse = await response.json()

    localStorage.setItem('atlasone_access_token', data.accessToken)
    localStorage.setItem('atlasone_refresh_token', data.refreshToken)

    return data
}

export function logout(): void {
    localStorage.removeItem('atlasone_access_token')
    localStorage.removeItem('atlasone_refresh_token')

    window.dispatchEvent(new Event('atlasone:logout'))
}

export function getAccessToken(): string | null {
    return localStorage.getItem('atlasone_access_token')
}

export function getRefreshToken(): string | null {
    return localStorage.getItem('atlasone_refresh_token')
}

export async function refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
        logout()
        throw new Error('Sessão expirada. Faça login novamente.')
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
        logout()
        throw new Error('Sessão expirada. Faça login novamente.')
    }

    const data: AuthResponse = await response.json()

    localStorage.setItem('atlasone_access_token', data.accessToken)
    localStorage.setItem('atlasone_refresh_token', data.refreshToken)

    return data.accessToken
}