import { useEffect, useState, type ReactNode } from 'react'

import {
    getAccessToken,
    logout as clearSession,
    login as authenticate,
} from '../services/authService'

import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => Boolean(getAccessToken()),
    )

    useEffect(() => {
        function handleSessionExpired() {
            setIsAuthenticated(false)
        }

        window.addEventListener('atlasone:logout', handleSessionExpired)

        return () => {
            window.removeEventListener('atlasone:logout', handleSessionExpired)
        }
    }, [])

    async function signIn(credentials: Parameters<typeof authenticate>[0]) {
        await authenticate(credentials)
        setIsAuthenticated(true)
    }

    function signOut() {
        clearSession()
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}