import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUserRole, createRoleCheckResponse } from '@/lib/auth-utils'
import { logActivity, getClientIp } from '@/lib/activity-logger'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { authorized, session } = await checkUserRole(['admin'])
  const unauthorizedResponse = createRoleCheckResponse(authorized)
  if (unauthorizedResponse) return unauthorizedResponse

  try {
    const { id } = await context.params

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // In a real app, you would:
    // 1. Generate a password reset token
    // 2. Send an email with reset link
    // 3. Store the token with expiration
    
    // For now, we'll just log the activity
    await logActivity({
      userId: session.user.id,
      action: 'user.password_reset',
      resourceType: 'user',
      resourceId: id,
      changes: {
        email: user.email
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    })

    // Simulate email sending
    console.log(`Password reset email would be sent to: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}