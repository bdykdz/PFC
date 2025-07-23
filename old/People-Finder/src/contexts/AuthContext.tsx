// src/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { User } from 'firebase/auth'
import { handleFirebaseLogin } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setUser(user)
        setLoading(false)
      },
      (error) => {
        console.error('Auth state change error:', error)
        setUser(null)
        setLoading(false)
      }
    )
    
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await handleFirebaseLogin(email, password)
      router.push('/search')
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    // Redirect to logout page which will handle the logout process
    window.location.href = '/logout'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)