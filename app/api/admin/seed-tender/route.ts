import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌱 Seeding tender-specific data...')

    // Get all existing employees
    const employees = await prisma.employee.findMany({
      select: { 
        id: true, 
        name: true, 
        department: true, 
        expertise: true,
        general_experience: true,
        created_at: true
      }
    })

    console.log(`Found ${employees.length} employees to update...`)

    let updatedCount = 0

    // Update employees with default tender fields
    for (const employee of employees) {
      // Check if already has tender data
      const existing = await prisma.employee.findUnique({
        where: { id: employee.id },
        select: { 
          project_categories: true,
          security_clearance: true,
          availability_status: true 
        }
      })

      // Skip if already has tender data
      if (existing?.project_categories || existing?.security_clearance || existing?.availability_status !== 'Available') {
        continue
      }

      // Calculate years of experience
      const experienceDate = employee.general_experience || employee.created_at
      const yearsExperience = Math.floor(
        (new Date().getTime() - new Date(experienceDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      )

      // Determine project categories based on department/expertise
      let projectCategories = ['IT & Software']
      if (employee.department?.toLowerCase().includes('construction')) {
        projectCategories = ['Construction', 'Infrastructure']
      } else if (employee.department?.toLowerCase().includes('water')) {
        projectCategories = ['Water & Utilities', 'Infrastructure']  
      } else if (employee.expertise?.toLowerCase().includes('infrastructure')) {
        projectCategories = ['Infrastructure', 'Transportation']
      } else if (employee.expertise?.toLowerCase().includes('software') || 
                 employee.expertise?.toLowerCase().includes('it')) {
        projectCategories = ['IT & Software', 'Telecommunications']
      }

      // Default languages (Romanian + English)
      const languages = [
        { language: 'Romanian', level: 'Native' },
        { language: 'English', level: 'Intermediate' }
      ]

      // Random but reasonable defaults
      const isKeyExpert = Math.random() > 0.8 // 20% are key experts
      const hourlyRate = 30 + Math.floor(Math.random() * 70) // 30-100 EUR/hour

      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          project_categories: projectCategories,
          security_clearance: 'Public',
          availability_status: 'Available',
          hourly_rate: hourlyRate,
          languages: languages,
          is_key_expert: isKeyExpert,
          years_experience: Math.max(0, yearsExperience),
          location: 'Bucharest' // Default location
        }
      })

      updatedCount++
    }

    // Create a sample tender project if none exist
    const existingProjects = await prisma.tenderProject.count()
    let sampleProjectCreated = false

    if (existingProjects === 0) {
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
      })

      if (admin) {
        const sampleProject = await prisma.tenderProject.create({
          data: {
            name: 'Highway Infrastructure Modernization',
            description: 'Major highway upgrade project including bridges and smart traffic systems',
            client: 'Ministry of Transportation',
            project_category: 'Infrastructure',
            submission_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'Draft',
            estimated_value: 15000000, // 15M EUR
            requirements: {
              clearance_required: 'Public',
              skills_needed: ['Civil Engineering', 'Project Management', 'Bridge Design'],
              team_size: '8-12 people',
              duration: '24 months'
            },
            created_by_id: admin.id
          }
        })

        // Create a sample team
        await prisma.tenderTeam.create({
          data: {
            project_id: sampleProject.id,
            name: 'Technical Team',
            description: 'Core engineering and project management team'
          }
        })

        sampleProjectCreated = true
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} employees with tender data${sampleProjectCreated ? ' and created sample project' : ''}`
    })

  } catch (error) {
    console.error('Error seeding tender data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}