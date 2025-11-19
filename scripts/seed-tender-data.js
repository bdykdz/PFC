const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedTenderData() {
  console.log('🌱 Seeding tender-specific data...')

  try {
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

    // Update employees with default tender fields
    for (const employee of employees) {
      // Calculate years of experience
      const experienceDate = employee.general_experience || employee.created_at
      const yearsExperience = Math.floor(
        (new Date().getTime() - new Date(experienceDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      )

      // Determine project categories based on department/expertise
      let projectCategories = ['IT']
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

      console.log(`✓ Updated ${employee.name}`)
    }

    // Create a sample tender project
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

      console.log(`✓ Created sample project: ${sampleProject.name}`)

      // Create a sample team
      const sampleTeam = await prisma.tenderTeam.create({
        data: {
          project_id: sampleProject.id,
          name: 'Technical Team',
          description: 'Core engineering and project management team'
        }
      })

      console.log(`✓ Created sample team: ${sampleTeam.name}`)
    }

    console.log('✅ Tender data seeding completed!')

  } catch (error) {
    console.error('❌ Error seeding tender data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedTenderData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = seedTenderData