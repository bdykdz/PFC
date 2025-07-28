import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has linked employee profile
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: user.email },
          { azure_id: user.azure_id }
        ]
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
            documents: true
          }
        }
      }
    })

    // Get activity stats
    const activityStats = await prisma.auditLog.aggregate({
      where: { user_id: user.id },
      _count: true
    })

    const recentActions = await prisma.auditLog.count({
      where: {
        user_id: user.id,
        created_at: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    })

    const lastAction = await prisma.auditLog.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    })

    return NextResponse.json({
      ...user,
      employee: employee,
      activityStats: {
        totalActions: activityStats._count,
        recentActions,
        lastAction: lastAction?.created_at || null
      }
    })
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() }
    })

    // Check if user has linked employee profile
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: updatedUser.email },
          { azure_id: updatedUser.azure_id }
        ]
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
            documents: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'UPDATE',
        resource_type: 'profile',
        resource_id: session.user.id,
        changes: { name: name.trim() }
      }
    })

    // Get updated activity stats
    const activityStats = await prisma.auditLog.aggregate({
      where: { user_id: updatedUser.id },
      _count: true
    })

    const recentActions = await prisma.auditLog.count({
      where: {
        user_id: updatedUser.id,
        created_at: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    })

    const lastAction = await prisma.auditLog.findFirst({
      where: { user_id: updatedUser.id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    })

    return NextResponse.json({
      ...updatedUser,
      employee: employee,
      activityStats: {
        totalActions: activityStats._count,
        recentActions,
        lastAction: lastAction?.created_at || null
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}