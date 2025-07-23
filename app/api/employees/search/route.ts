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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''
    const company = searchParams.get('company') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { expertise: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    // Get total count
    const totalCount = await prisma.employee.count({ where })

    // Get employees
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        contracts: {
          where: {
            end_date: null // Only include active contracts
          },
          take: 1,
          orderBy: {
            start_date: 'desc'
          }
        },
        skills: {
          take: 3,
          orderBy: {
            level: 'desc'
          }
        }
      }
    })

    // Get unique departments and companies for filters
    const departments = await prisma.employee.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: null } },
      orderBy: { department: 'asc' }
    })

    const companies = await prisma.employee.findMany({
      select: { company: true },
      distinct: ['company'],
      where: { company: { not: null } },
      orderBy: { company: 'asc' }
    })

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        departments: departments.map(d => d.department).filter(Boolean),
        companies: companies.map(c => c.company).filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}