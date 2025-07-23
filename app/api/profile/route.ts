import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to find linked employee profile
    const employee = await prisma.employee.findFirst({
      where: { 
        email: user.email 
      },
      select: {
        id: true,
        name: true,
        phone: true,
        company: true,
        department: true,
        expertise: true,
        _count: {
          select: {
            contracts: true,
            skills: true,
            diplomas: true,
            documents: true,
          }
        }
      }
    })

    // Get activity stats if user has performed actions
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalActions, recentActions, lastAction] = await Promise.all([
      prisma.auditLog.count({
        where: { user_id: user.id }
      }),
      prisma.auditLog.count({
        where: { 
          user_id: user.id,
          created_at: { gte: thirtyDaysAgo }
        }
      }),
      prisma.auditLog.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        select: { created_at: true }
      })
    ])

    const profile = {
      ...user,
      employee: employee || undefined,
      activityStats: {
        totalActions,
        recentActions,
        lastAction: lastAction?.created_at || null
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        name: name.trim(),
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      }
    })

    // Log the profile update
    await logActivity({
      userId: session.user.id,
      action: 'profile.updated' as any,
      resourceType: 'user',
      resourceId: session.user.id,
      changes: {
        oldName: session.user.name,
        newName: name.trim()
      }
    })

    // Get linked employee profile if exists
    const employee = await prisma.employee.findFirst({
      where: { 
        email: updatedUser.email 
      },
      select: {
        id: true,
        name: true,
        phone: true,
        company: true,
        department: true,
        expertise: true,
        _count: {
          select: {
            contracts: true,
            skills: true,
            diplomas: true,
            documents: true,
          }
        }
      }
    })

    // Get activity stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalActions, recentActions, lastAction] = await Promise.all([
      prisma.auditLog.count({
        where: { user_id: updatedUser.id }
      }),
      prisma.auditLog.count({
        where: { 
          user_id: updatedUser.id,
          created_at: { gte: thirtyDaysAgo }
        }
      }),
      prisma.auditLog.findFirst({
        where: { user_id: updatedUser.id },
        orderBy: { created_at: 'desc' },
        select: { created_at: true }
      })
    ])

    const profile = {
      ...updatedUser,
      employee: employee || undefined,
      activityStats: {
        totalActions,
        recentActions,
        lastAction: lastAction?.created_at || null
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}