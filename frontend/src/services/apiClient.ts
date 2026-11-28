import { API_BASE_URL } from './api'

import {
  getAccessToken,
  refreshAccessToken,
  logout,
} from './authService'

let refreshPromise: Promise<string> | null = null

async function renewToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiRequest(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status !== 401 || !retry) {
    if (response.status === 401 && !retry) {
      logout()
    }

    return response
  }

  try {
    const newAccessToken = await renewToken()

    headers.set('Authorization', `Bearer ${newAccessToken}`)

    return await apiRequest(
      path,
      {
        ...options,
        headers,
      },
      false,
    )
  } catch {
    logout()
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }
}