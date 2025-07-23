import { redirect } from 'next/navigation'
import { validateSession } from '@/lib/session-validation'
import ProtectedLayoutClient from './layout-client'
import { db } from '@/lib/firebase-admin'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionUser = await validateSession()
  
  if (!sessionUser) {
    redirect('/login')
  }

  // Check if user is admin
  let isAdmin = false
  try {
    const userDoc = await db.collection('users').doc(sessionUser.uid).get()
    if (userDoc.exists) {
      const userData = userDoc.data()
      isAdmin = userData?.role === 'admin'
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
  }

  return <ProtectedLayoutClient isAdmin={isAdmin}>{children}</ProtectedLayoutClient>
}