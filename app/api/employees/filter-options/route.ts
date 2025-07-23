import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get unique values for each filter
    const [departments, companies, contracts, skills] = await Promise.all([
      // Get unique departments
      prisma.employee.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ['department'],
      }),
      
      // Get unique companies
      prisma.employee.findMany({
        where: { company: { not: null } },
        select: { company: true },
        distinct: ['company'],
      }),
      
      // Get unique positions and locations from contracts
      prisma.contract.findMany({
        select: { 
          position: true,
          location: true,
        },
      }),
      
      // Get unique skill names
      prisma.skill.findMany({
        select: { name: true },
        distinct: ['name'],
      }),
    ])

    // Extract unique values
    const uniqueDepartments = departments
      .map(d => d.department)
      .filter(Boolean) as string[]
    
    const uniqueCompanies = companies
      .map(c => c.company)
      .filter(Boolean) as string[]
    
    const uniquePositions = Array.from(new Set(
      contracts
        .map(c => c.position)
        .filter(Boolean)
    )) as string[]
    
    const uniqueLocations = Array.from(new Set(
      contracts
        .map(c => c.location)
        .filter(Boolean)
    )) as string[]
    
    const uniqueSkills = Array.from(new Set(
      skills.map(s => s.name)
    ))

    return NextResponse.json({
      departments: uniqueDepartments.sort(),
      companies: uniqueCompanies.sort(),
      positions: uniquePositions.sort(),
      locations: uniqueLocations.sort(),
      contract_types: ['CIM', 'PFA', 'SRL'],
      skill_names: uniqueSkills.sort(),
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}