import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, logAdminAction } from '@/lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const adminUser = await validateAdminSession()
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, targetType, targetId, details } = body

    if (!action || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log the admin action
    await logAdminAction(
      adminUser.uid,
      action,
      targetType,
      targetId,
      details
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging admin action:', error)
    return NextResponse.json(
      { error: 'Failed to log action' },
      { status: 500 }
    )
  }
}