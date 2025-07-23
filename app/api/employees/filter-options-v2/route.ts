import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get unique values for each filter with more detail
    const [departments, companies, contracts, skills, diplomas] = await Promise.all([
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
      
      // Get unique positions, locations, and beneficiaries from contracts
      prisma.contract.findMany({
        select: { 
          position: true,
          location: true,
          beneficiary: true,
        },
      }),
      
      // Get unique skill names
      prisma.skill.findMany({
        select: { name: true },
        distinct: ['name'],
      }),
      
      // Get unique diploma names and issuers
      prisma.diploma.findMany({
        select: { 
          name: true,
          issuer: true,
        },
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
    
    const uniqueBeneficiaries = Array.from(new Set(
      contracts
        .map(c => c.beneficiary)
        .filter(Boolean)
    )) as string[]
    
    const uniqueSkills = Array.from(new Set(
      skills.map(s => s.name)
    ))
    
    const uniqueDiplomaNames = Array.from(new Set(
      diplomas.map(d => d.name)
    ))
    
    const uniqueDiplomaIssuers = Array.from(new Set(
      diplomas.map(d => d.issuer)
    ))

    return NextResponse.json({
      departments: uniqueDepartments.sort(),
      companies: uniqueCompanies.sort(),
      positions: uniquePositions.sort(),
      locations: uniqueLocations.sort(),
      beneficiaries: uniqueBeneficiaries.sort(),
      contract_types: ['CIM', 'PFA', 'SRL'],
      skill_names: uniqueSkills.sort(),
      skill_levels: ['Beginner', 'Intermediate', 'Expert'],
      diploma_names: uniqueDiplomaNames.sort(),
      diploma_issuers: uniqueDiplomaIssuers.sort(),
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}