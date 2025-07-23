import { NextRequest, NextResponse } from 'next/server'
import { checkUserRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkUserRole(['admin', 'editor'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all employees with their counts
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        department: true,
        general_experience: true,
        expertise: true,
        _count: {
          select: {
            contracts: true,
            skills: true,
            diplomas: true,
            documents: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}