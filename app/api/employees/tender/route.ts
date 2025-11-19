import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employees with tender-specific fields
    const employees = await prisma.employee.findMany({
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
      },
      orderBy: [
        { is_key_expert: 'desc' },
        { name: 'asc' }
      ]
    })

    // Transform to match TenderEmployee interface
    const tenderEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department || undefined,
      expertise: employee.expertise || undefined,
      yearsExperience: employee.years_experience || undefined,
      projectCategories: Array.isArray(employee.project_categories) 
        ? employee.project_categories as string[]
        : [],
      securityClearance: employee.security_clearance || undefined,
      availabilityStatus: employee.availability_status || undefined,
      hourlyRate: employee.hourly_rate ? Number(employee.hourly_rate) : undefined,
      languages: Array.isArray(employee.languages) 
        ? employee.languages as Array<{language: string, level: string}>
        : [],
      isKeyExpert: employee.is_key_expert,
      location: employee.location || undefined,
      certifications: Array.isArray(employee.certifications) 
        ? employee.certifications as Array<{name: string, issuer: string, issueDate: string, expiryDate?: string, certificateNumber?: string}>
        : [],
      profileImageUrl: employee.profile_image_url || undefined,
      skills: employee.skills.map(skill => ({
        name: skill.name,
        level: skill.level,
        type: skill.type
      }))
    }))

    return NextResponse.json(tenderEmployees)
  } catch (error) {
    console.error('Error fetching tender employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}