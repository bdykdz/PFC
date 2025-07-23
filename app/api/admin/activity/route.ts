import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUserRole, createRoleCheckResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { authorized } = await checkUserRole(['admin'])
  const unauthorizedResponse = createRoleCheckResponse(authorized)
  if (unauthorizedResponse) return unauthorizedResponse

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get total count
    const totalCount = await prisma.auditLog.count({ where })
    const totalPages = Math.ceil(totalCount / limit)

    // Get activities
    const activities = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      activities,
      totalPages,
      currentPage: page,
      totalCount
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}