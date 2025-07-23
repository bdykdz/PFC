import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Get search parameters
    const name = searchParams.get('name') || ''
    const skills = searchParams.get('skills') || ''
    const department = searchParams.get('department')
    const company = searchParams.get('company')
    const position = searchParams.get('position')
    const location = searchParams.get('location')
    const contractType = searchParams.get('contractType')
    const minContracts = searchParams.get('minContracts')
    const minExperience = searchParams.get('minExperience')

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {}
    
    // Name or email search
    if (name) {
      where.OR = [
        { name: { contains: name, mode: 'insensitive' } },
        { email: { contains: name, mode: 'insensitive' } }
      ]
    }

    // Department filter
    if (department && department !== 'all') {
      where.department = department
    }

    // Company filter
    if (company && company !== 'all') {
      where.company = company
    }

    // Contract type filter
    if (contractType && contractType !== 'all') {
      where.contract_type = contractType
    }

    // Get all employees first to apply complex filters
    let employees = await prisma.employee.findMany({
      where,
      include: {
        contracts: {
          orderBy: { start_date: 'desc' },
          include: {
            documents: true
          }
        },
        skills: true,
        diplomas: {
          orderBy: { issue_date: 'desc' }
        }
      }
    })

    // Apply skill filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase())
      employees = employees.filter(emp => 
        emp.skills.some(skill => 
          skillsArray.some(searchSkill => 
            skill.name.toLowerCase().includes(searchSkill)
          )
        )
      )
    }

    // Apply position filter
    if (position && position !== 'all') {
      employees = employees.filter(emp =>
        emp.contracts.some(contract => 
          contract.position?.toLowerCase().includes(position.toLowerCase())
        )
      )
    }

    // Apply location filter
    if (location && location !== 'all') {
      employees = employees.filter(emp =>
        emp.contracts.some(contract => 
          contract.location?.toLowerCase().includes(location.toLowerCase())
        )
      )
    }

    // Apply minimum contracts filter
    if (minContracts) {
      const min = parseInt(minContracts)
      employees = employees.filter(emp => emp.contracts.length >= min)
    }

    // Apply minimum experience filter
    if (minExperience && employees.length > 0) {
      const minYears = parseInt(minExperience)
      const currentDate = new Date()
      
      employees = employees.filter(emp => {
        if (!emp.general_experience) return false
        
        const experienceDate = new Date(emp.general_experience)
        const yearsOfExperience = (currentDate.getTime() - experienceDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        
        return yearsOfExperience >= minYears
      })
    }

    // Transform the results
    const results = employees.map(emp => {
      // Get current contracts (no end date or end date in future)
      const currentContracts = emp.contracts.filter(c => 
        !c.end_date || new Date(c.end_date) > new Date()
      )

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        company: emp.company,
        expertise: emp.expertise,
        profile_image_url: emp.profile_image_url,
        contract_type: emp.contract_type,
        general_experience: emp.general_experience,
        contracts_count: emp.contracts.length,
        current_contracts: currentContracts.map(c => ({
          id: c.id,
          name: c.name,
          position: c.position,
          beneficiary: c.beneficiary,
          location: c.location
        })),
        skills: emp.skills.map(s => ({
          id: s.id,
          name: s.name,
          level: s.level,
          type: s.type
        })),
        diplomas_count: emp.diplomas.length
      }
    })

    // Sort by relevance (more contracts and skills first)
    results.sort((a, b) => {
      const scoreA = a.contracts_count + a.skills.length
      const scoreB = b.contracts_count + b.skills.length
      return scoreB - scoreA
    })

    return NextResponse.json({
      employees: results,
      total: results.length
    })
  } catch (error) {
    console.error('Error in advanced search:', error)
    return NextResponse.json(
      { error: 'Failed to search employees' },
      { status: 500 }
    )
  }
}