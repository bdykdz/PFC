import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, role, responsibility, allocation } = body

    // Check if member already exists in this team
    const existingMember = await prisma.tenderTeamMember.findFirst({
      where: {
        team_id: params.teamId,
        employee_id: employeeId
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Employee is already a member of this team' },
        { status: 400 }
      )
    }

    // Add member to team
    await prisma.tenderTeamMember.create({
      data: {
        team_id: params.teamId,
        employee_id: employeeId,
        role,
        responsibility,
        allocation: allocation || 100
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}