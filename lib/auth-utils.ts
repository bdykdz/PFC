import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { NextResponse } from 'next/server'

export type UserRole = 'viewer' | 'editor' | 'admin'

export async function checkUserRole(allowedRoles: UserRole[]): Promise<{ authorized: boolean; session: any }> {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return { authorized: false, session: null }
  }

  // Check if user's role is in the allowed roles
  const userRole = session.user.role as UserRole
  const authorized = allowedRoles.includes(userRole)
  
  return { authorized, session }
}

export function createRoleCheckResponse(authorized: boolean) {
  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Insufficient permissions.' },
      { status: 403 }
    )
  }
  return null
}

// Helper function to check if user can edit
export function canUserEdit(userRole: string): boolean {
  return userRole === 'editor' || userRole === 'admin'
}

// Helper function to check if user is admin
export function isAdmin(userRole: string): boolean {
  return userRole === 'admin'
}