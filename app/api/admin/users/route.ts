import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkUserRole, createRoleCheckResponse } from '@/lib/auth-utils'
import { logActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  const { authorized, session } = await checkUserRole(['admin'])
  const unauthorizedResponse = createRoleCheckResponse(authorized)
  if (unauthorizedResponse) return unauthorizedResponse

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role !== 'all') {
      where.role = role
    }

    // Get all users first to calculate stats
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        sessions: {
          select: {
            expires: true
          },
          orderBy: {
            expires: 'desc'
          },
          take: 1
        }
      }
    })

    // Calculate stats
    const now = new Date()
    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => 
        u.sessions.length > 0 && new Date(u.sessions[0].expires) > now
      ).length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      editors: allUsers.filter(u => u.role === 'editor').length,
      viewers: allUsers.filter(u => u.role === 'viewer').length
    }

    // Get filtered users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        last_login: true,
        created_at: true,
        accounts: {
          select: {
            provider: true
          }
        },
        sessions: {
          select: {
            expires: true
          },
          orderBy: {
            expires: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform users data
    const transformedUsers = users.map(user => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        last_login: user.last_login,
        created_at: user.created_at,
        provider: user.accounts[0]?.provider || 'local'
      }
    })

    // Apply status filter
    const filteredUsers = status === 'all' 
      ? transformedUsers
      : transformedUsers.filter(u => u.status === status)

    return NextResponse.json({
      users: filteredUsers,
      stats
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}