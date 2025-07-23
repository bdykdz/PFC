import { auth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export interface SessionUser {
  uid: string
  email: string | undefined
  emailVerified: boolean
}

export async function validateSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie?.value) {
      return null
    }

    // Verify the session cookie with Firebase Admin SDK
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true)
    
    // Check if token is expired
    const currentTime = Date.now() / 1000
    if (decodedClaims.exp < currentTime) {
      return null
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      emailVerified: decodedClaims.email_verified || false
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await validateSession()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}