import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma-singleton'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.tenderProject.findMany({
      include: {
        teams: {
          include: {
            members: {
              include: {
                employee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    expertise: true,
                    project_categories: true,
                    security_clearance: true,
                    availability_status: true,
                    hourly_rate: true,
                    languages: true,
                    is_key_expert: true,
                    years_experience: true,
                    location: true,
                    certifications: true,
                    profile_image_url: true,
                    skills: {
                      select: {
                        name: true,
                        level: true,
                        type: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    })

    // Transform to match TenderProject interface
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      client: project.client || undefined,
      projectCategory: project.project_category || undefined,
      submissionDate: project.submission_date || undefined,
      status: project.status as 'Draft' | 'In Progress' | 'Submitted' | 'Won' | 'Lost',
      estimatedValue: project.estimated_value ? Number(project.estimated_value) : undefined,
      requirements: project.requirements || undefined,
      teams: project.teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        members: team.members.map(member => ({
          id: member.id,
          employee: {
            id: member.employee.id,
            name: member.employee.name,
            email: member.employee.email,
            department: member.employee.department || undefined,
            expertise: member.employee.expertise || undefined,
            yearsExperience: member.employee.years_experience || undefined,
            projectCategories: Array.isArray(member.employee.project_categories) 
              ? member.employee.project_categories as string[]
              : [],
            securityClearance: member.employee.security_clearance || undefined,
            availabilityStatus: member.employee.availability_status || undefined,
            hourlyRate: member.employee.hourly_rate ? Number(member.employee.hourly_rate) : undefined,
            languages: Array.isArray(member.employee.languages) 
              ? member.employee.languages as Array<{language: string, level: string}>
              : [],
            isKeyExpert: member.employee.is_key_expert,
            location: member.employee.location || undefined,
            certifications: Array.isArray(member.employee.certifications) 
              ? member.employee.certifications as Array<{name: string, issuer: string, issueDate: string, expiryDate?: string, certificateNumber?: string}>
              : [],
            profileImageUrl: member.employee.profile_image_url || undefined,
            skills: member.employee.skills.map(skill => ({
              name: skill.name,
              level: skill.level,
              type: skill.type
            }))
          },
          role: member.role,
          responsibility: member.responsibility || undefined,
          allocation: member.allocation || undefined,
          cost: member.allocation && member.employee.hourly_rate 
            ? (member.allocation / 100) * Number(member.employee.hourly_rate) * 160
            : undefined
        })),
        totalCost: team.members.reduce((total, member) => {
          const rate = member.employee.hourly_rate ? Number(member.employee.hourly_rate) : 0
          const allocation = member.allocation ? member.allocation / 100 : 1
          return total + (rate * allocation * 160)
        }, 0)
      })),
      totalProjectCost: project.teams.reduce((total, team) => {
        return total + team.members.reduce((teamTotal, member) => {
          const rate = member.employee.hourly_rate ? Number(member.employee.hourly_rate) : 0
          const allocation = member.allocation ? member.allocation / 100 : 1
          return teamTotal + (rate * allocation * 160)
        }, 0)
      }, 0),
      createdBy: project.created_by_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }))

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error fetching tender projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      client,
      projectCategory,
      submissionDate,
      estimatedValue
    } = body

    const project = await prisma.tenderProject.create({
      data: {
        name,
        description,
        client,
        project_category: projectCategory,
        submission_date: submissionDate ? new Date(submissionDate) : undefined,
        estimated_value: estimatedValue,
        created_by_id: session.user.id
      },
      include: {
        teams: {
          include: {
            members: {
              include: {
                employee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    expertise: true,
                    project_categories: true,
                    security_clearance: true,
                    availability_status: true,
                    hourly_rate: true,
                    languages: true,
                    is_key_expert: true,
                    years_experience: true,
                    location: true,
                    certifications: true,
                    profile_image_url: true,
                    skills: {
                      select: {
                        name: true,
                        level: true,
                        type: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform response
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      client: project.client || undefined,
      projectCategory: project.project_category || undefined,
      submissionDate: project.submission_date || undefined,
      status: project.status as 'Draft' | 'In Progress' | 'Submitted' | 'Won' | 'Lost',
      estimatedValue: project.estimated_value ? Number(project.estimated_value) : undefined,
      requirements: project.requirements || undefined,
      teams: [],
      totalProjectCost: 0,
      createdBy: project.created_by_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error creating tender project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}