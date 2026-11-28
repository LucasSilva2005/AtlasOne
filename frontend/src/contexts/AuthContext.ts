import { createContext } from 'react'
import type { LoginRequest } from '../services/authService'

export interface AuthContextData {
  isAuthenticated: boolean
  signIn: (credentials: LoginRequest) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextData | null>(null)