import { db } from '@/lib/firebase-admin'
import { validateSession } from '@/lib/session-validation'

export interface AdminUser {
  uid: string
  email: string | undefined
  role: 'admin' | 'user'
  name?: string
}

/**
 * Validates if the current user has admin privileges
 * @returns AdminUser object if user is admin, null otherwise
 */
export async function validateAdminSession(): Promise<AdminUser | null> {
  try {
    // First validate the session
    const sessionUser = await validateSession()
    
    if (!sessionUser) {
      return null
    }

    // Check if user has admin role in database
    const userDoc = await db.collection('users').doc(sessionUser.uid).get()
    
    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data()
    
    // Check if user has admin role
    if (userData?.role !== 'admin') {
      return null
    }

    return {
      uid: sessionUser.uid,
      email: sessionUser.email,
      role: 'admin',
      name: userData.name
    }
  } catch (error) {
    console.error('Admin validation error:', error)
    return null
  }
}

/**
 * Logs admin actions for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: 'user' | 'contract' | 'diploma' | 'skill',
  targetId: string,
  details?: Record<string, any>
) {
  try {
    await db.collection('admin_logs').add({
      adminId,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date(),
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}