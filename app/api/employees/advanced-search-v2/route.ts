import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface QueryCondition {
  id: string
  field: string
  operator: string
  value: string | string[]
  logicalOperator: 'AND' | 'OR'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queries }: { queries: QueryCondition[] } = body

    if (!queries || queries.length === 0) {
      return NextResponse.json({ employees: [] })
    }

    // Get all employees with full data first
    let allEmployees = await prisma.employee.findMany({
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

    // Apply each query condition
    let filteredEmployees = allEmployees
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      
      if (!query.value || (Array.isArray(query.value) && query.value.length === 0)) {
        continue
      }

      const matchingEmployees = allEmployees.filter(emp => {
        switch (query.field) {
          case 'name':
            const searchValue = (query.value as string).toLowerCase()
            switch (query.operator) {
              case 'contains':
                return emp.name.toLowerCase().includes(searchValue) || 
                       emp.email.toLowerCase().includes(searchValue)
              case 'exact':
                return emp.name.toLowerCase() === searchValue || 
                       emp.email.toLowerCase() === searchValue
              case 'starts_with':
                return emp.name.toLowerCase().startsWith(searchValue) || 
                       emp.email.toLowerCase().startsWith(searchValue)
              case 'ends_with':
                return emp.name.toLowerCase().endsWith(searchValue) || 
                       emp.email.toLowerCase().endsWith(searchValue)
              default:
                return false
            }

          case 'skills':
            const skillValues = Array.isArray(query.value) ? query.value : (query.value as string).split(',').map(s => s.trim())
            const empSkillNames = emp.skills.map(s => s.name.toLowerCase())
            switch (query.operator) {
              case 'has_any':
                return skillValues.some(skill => 
                  empSkillNames.some(empSkill => empSkill.includes(skill.toLowerCase()))
                )
              case 'has_all':
                return skillValues.every(skill => 
                  empSkillNames.some(empSkill => empSkill.includes(skill.toLowerCase()))
                )
              case 'not_has':
                return !skillValues.some(skill => 
                  empSkillNames.some(empSkill => empSkill.includes(skill.toLowerCase()))
                )
              default:
                return false
            }

          case 'skill_level':
            if (!query.value) return true
            const targetLevel = query.value as string
            const levelOrder = { 'Beginner': 1, 'Intermediate': 2, 'Expert': 3 }
            switch (query.operator) {
              case 'is':
                return emp.skills.some(s => s.level === targetLevel)
              case 'at_least':
                const minLevel = levelOrder[targetLevel as keyof typeof levelOrder] || 0
                return emp.skills.some(s => {
                  const skillLevel = levelOrder[s.level as keyof typeof levelOrder] || 0
                  return skillLevel >= minLevel
                })
              default:
                return false
            }

          case 'department':
            if (!emp.department) return false
            switch (query.operator) {
              case 'is':
                return emp.department === query.value
              case 'is_not':
                return emp.department !== query.value
              case 'in':
                const deptValues = Array.isArray(query.value) ? query.value : [query.value]
                return deptValues.includes(emp.department)
              default:
                return false
            }

          case 'company':
            if (!emp.company) return false
            switch (query.operator) {
              case 'is':
                return emp.company === query.value
              case 'is_not':
                return emp.company !== query.value
              case 'in':
                const compValues = Array.isArray(query.value) ? query.value : [query.value]
                return compValues.includes(emp.company)
              default:
                return false
            }

          case 'position':
            const positions = emp.contracts.map(c => c.position).filter(Boolean)
            if (positions.length === 0) return false
            switch (query.operator) {
              case 'contains':
                return positions.some(pos => pos!.toLowerCase().includes((query.value as string).toLowerCase()))
              case 'is':
                return positions.some(pos => pos === query.value)
              case 'in':
                const posValues = Array.isArray(query.value) ? query.value : [query.value]
                return positions.some(pos => posValues.includes(pos!))
              default:
                return false
            }

          case 'location':
            const locations = emp.contracts.map(c => c.location).filter(Boolean)
            if (locations.length === 0) return false
            switch (query.operator) {
              case 'is':
                return locations.some(loc => loc === query.value)
              case 'in':
                const locValues = Array.isArray(query.value) ? query.value : [query.value]
                return locations.some(loc => locValues.includes(loc!))
              case 'contains':
                return locations.some(loc => loc!.toLowerCase().includes((query.value as string).toLowerCase()))
              default:
                return false
            }

          case 'beneficiary':
            const beneficiaries = emp.contracts.map(c => c.beneficiary).filter(Boolean)
            if (beneficiaries.length === 0) return false
            switch (query.operator) {
              case 'is':
                return beneficiaries.some(ben => ben === query.value)
              case 'contains':
                return beneficiaries.some(ben => ben!.toLowerCase().includes((query.value as string).toLowerCase()))
              case 'in':
                const benValues = Array.isArray(query.value) ? query.value : [query.value]
                return beneficiaries.some(ben => benValues.includes(ben!))
              default:
                return false
            }

          case 'contract_type':
            if (!emp.contract_type) return false
            switch (query.operator) {
              case 'is':
                return emp.contract_type === query.value
              case 'in':
                const typeValues = Array.isArray(query.value) ? query.value : [query.value]
                return typeValues.includes(emp.contract_type)
              default:
                return false
            }

          case 'contracts_count':
            const count = emp.contracts.length
            const targetCount = parseInt(query.value as string)
            switch (query.operator) {
              case 'equals':
                return count === targetCount
              case 'greater_than':
                return count > targetCount
              case 'less_than':
                return count < targetCount
              case 'between':
                const [min, max] = (query.value as string).split('-').map(n => parseInt(n))
                return count >= min && count <= max
              default:
                return false
            }

          case 'active_contracts':
            const now = new Date()
            const activeContracts = emp.contracts.filter(c => 
              !c.end_date || new Date(c.end_date) > now
            )
            switch (query.operator) {
              case 'has':
                return activeContracts.length > 0
              case 'no':
                return activeContracts.length === 0
              case 'count':
                const targetActive = parseInt(query.value as string)
                return activeContracts.length === targetActive
              default:
                return false
            }

          case 'experience_years':
            if (!emp.general_experience) return false
            const expDate = new Date(emp.general_experience)
            const currentDate = new Date()
            const yearsOfExp = (currentDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            const targetYears = parseInt(query.value as string)
            switch (query.operator) {
              case 'equals':
                return Math.floor(yearsOfExp) === targetYears
              case 'greater_than':
                return yearsOfExp > targetYears
              case 'less_than':
                return yearsOfExp < targetYears
              case 'between':
                const [minYears, maxYears] = (query.value as string).split('-').map(n => parseInt(n))
                return yearsOfExp >= minYears && yearsOfExp <= maxYears
              default:
                return false
            }

          case 'contract_date':
            const [startStr, endStr] = (query.value as string).split('-')
            const startDate = startStr ? new Date(startStr) : null
            const endDate = endStr ? new Date(endStr) : null
            
            switch (query.operator) {
              case 'active_in':
                return emp.contracts.some(c => {
                  const cStart = new Date(c.start_date)
                  const cEnd = c.end_date ? new Date(c.end_date) : new Date('2099-12-31')
                  return startDate && endDate && cStart <= endDate && cEnd >= startDate
                })
              case 'started_in':
                return emp.contracts.some(c => {
                  const cStart = new Date(c.start_date)
                  return startDate && endDate && cStart >= startDate && cStart <= endDate
                })
              case 'ended_in':
                return emp.contracts.some(c => {
                  if (!c.end_date) return false
                  const cEnd = new Date(c.end_date)
                  return startDate && endDate && cEnd >= startDate && cEnd <= endDate
                })
              default:
                return false
            }

          case 'diploma':
            const diplomaNames = emp.diplomas.map(d => d.name.toLowerCase())
            if (diplomaNames.length === 0) return query.operator === 'not_has'
            const diplomaSearch = (query.value as string).toLowerCase()
            switch (query.operator) {
              case 'has':
                return diplomaNames.some(name => name === diplomaSearch)
              case 'not_has':
                return !diplomaNames.some(name => name === diplomaSearch)
              case 'contains':
                return diplomaNames.some(name => name.includes(diplomaSearch))
              default:
                return false
            }

          case 'diploma_issuer':
            const issuers = emp.diplomas.map(d => d.issuer)
            if (issuers.length === 0) return false
            switch (query.operator) {
              case 'is':
                return issuers.some(issuer => issuer === query.value)
              case 'contains':
                return issuers.some(issuer => issuer.toLowerCase().includes((query.value as string).toLowerCase()))
              case 'in':
                const issuerValues = Array.isArray(query.value) ? query.value : [query.value]
                return issuers.some(issuer => issuerValues.includes(issuer))
              default:
                return false
            }

          default:
            return true
        }
      })

      // Apply logical operator
      if (i === 0) {
        filteredEmployees = matchingEmployees
      } else {
        const prevQuery = queries[i - 1]
        if (query.logicalOperator === 'AND') {
          filteredEmployees = filteredEmployees.filter(emp => matchingEmployees.includes(emp))
        } else { // OR
          const combinedIds = new Set([...filteredEmployees.map(e => e.id), ...matchingEmployees.map(e => e.id)])
          filteredEmployees = allEmployees.filter(emp => combinedIds.has(emp.id))
        }
      }
    }

    // Transform the results
    const now = new Date()
    const results = filteredEmployees.map(emp => {
      const activeContracts = emp.contracts.filter(c => 
        !c.end_date || new Date(c.end_date) > now
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
        active_contracts_count: activeContracts.length,
        current_contracts: activeContracts.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          position: c.position,
          beneficiary: c.beneficiary,
          location: c.location,
          start_date: c.start_date.toISOString(),
          end_date: c.end_date?.toISOString() || null
        })),
        skills: emp.skills.map(s => ({
          id: s.id,
          name: s.name,
          level: s.level,
          type: s.type
        })),
        diplomas_count: emp.diplomas.length,
        recent_diplomas: emp.diplomas.slice(0, 2).map(d => ({
          id: d.id,
          name: d.name,
          issuer: d.issuer,
          issue_date: d.issue_date.toISOString()
        }))
      }
    })

    // Sort by relevance
    results.sort((a, b) => {
      const scoreA = a.contracts_count + a.skills.length + a.active_contracts_count * 2
      const scoreB = b.contracts_count + b.skills.length + b.active_contracts_count * 2
      return scoreB - scoreA
    })

    return NextResponse.json({
      employees: results,
      total: results.length,
      query_summary: queries.map(q => ({
        field: q.field,
        operator: q.operator,
        value: q.value,
        logicalOperator: q.logicalOperator
      }))
    })
  } catch (error) {
    console.error('Error in advanced search v2:', error)
    return NextResponse.json(
      { error: 'Failed to search employees' },
      { status: 500 }
    )
  }
}