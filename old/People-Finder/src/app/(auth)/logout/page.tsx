'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Sign out from Firebase
        await auth.signOut()
        
        // Clear session cookie
        await fetch('/api/auth/session', { 
          method: 'DELETE',
          credentials: 'same-origin'
        })
        
        // Clear any local storage or session storage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Redirect to login after a small delay to ensure everything is cleared
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      } catch (error) {
        console.error('Logout error:', error)
        // Force redirect even on error
        window.location.href = '/login'
      }
    }

    performLogout()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Logging out...</p>
      </div>
    </div>
  )
}