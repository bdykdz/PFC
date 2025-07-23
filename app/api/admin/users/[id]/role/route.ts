import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUserRole, createRoleCheckResponse } from '@/lib/auth-utils'
import { logActivity, getClientIp } from '@/lib/activity-logger'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { authorized, session } = await checkUserRole(['admin'])
  const unauthorizedResponse = createRoleCheckResponse(authorized)
  if (unauthorizedResponse) return unauthorizedResponse

  try {
    const { id } = await context.params
    const { role } = await request.json()

    // Validate role
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Don't allow users to change their own role
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Get the old role for logging
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!oldUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    })

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: 'user.role_changed',
      resourceType: 'user',
      resourceId: id,
      changes: {
        from: oldUser.role,
        to: role
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role
      }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}