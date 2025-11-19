import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma-singleton'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    
    // Verify the team member belongs to the specified team and user has access
    const teamMember = await prisma.tenderTeamMember.findUnique({
      where: { id: params.memberId },
      include: {
        team: {
          include: {
            project: true
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    if (teamMember.team_id !== params.teamId) {
      return NextResponse.json({ error: 'Team member does not belong to specified team' }, { status: 400 })
    }

    // Check if user is admin or the creator of the project
    if (session.user?.role !== 'admin' && teamMember.team.project.created_by_id !== session.user?.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Remove team member
    await prisma.tenderTeamMember.delete({
      where: {
        id: params.memberId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}