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
    const { status } = await request.json()

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Don't allow users to disable themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot disable your own account' },
        { status: 400 }
      )
    }

    // If disabling, remove all sessions
    if (status === 'inactive') {
      await prisma.session.deleteMany({
        where: { userId: id }
      })
    }

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: 'user.status_changed',
      resourceType: 'user',
      resourceId: id,
      changes: {
        status: status
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      status: status
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}