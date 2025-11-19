import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const timeRange = searchParams.get('range') || '6months'

    // Get all employees with tender data
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        project_categories: true,
        security_clearance: true,
        availability_status: true,
        hourly_rate: true,
        is_key_expert: true,
        years_experience: true,
        general_experience: true,
        created_at: true,
        skills: {
          select: {
            name: true,
            level: true,
            type: true
          }
        }
      }
    })

    // Filter by category if needed (client-side filtering since JSON queries are complex)
    const filteredEmployees = category !== 'all' 
      ? employees.filter(emp => {
          if (Array.isArray(emp.project_categories)) {
            return emp.project_categories.includes(category)
          }
          return false
        })
      : employees

    // Calculate capability report
    const totalEmployees = filteredEmployees.length
    const availableEmployees = filteredEmployees.filter(emp => emp.availability_status === 'Available').length
    const keyExperts = filteredEmployees.filter(emp => emp.is_key_expert).length

    // Category breakdown
    const categoryStats = new Map<string, number>()
    filteredEmployees.forEach(emp => {
      if (Array.isArray(emp.project_categories)) {
        emp.project_categories.forEach((cat: string) => {
          categoryStats.set(cat, (categoryStats.get(cat) || 0) + 1)
        })
      }
    })

    const categoryBreakdown = Array.from(categoryStats.entries()).map(([cat, count]) => ({
      category: cat,
      count,
      percentage: Math.round((count / totalEmployees) * 100)
    })).sort((a, b) => b.count - a.count)

    // Experience breakdown
    const experienceRanges = [
      { range: '0-2 years', min: 0, max: 2 },
      { range: '3-5 years', min: 3, max: 5 },
      { range: '6-10 years', min: 6, max: 10 },
      { range: '11-15 years', min: 11, max: 15 },
      { range: '16+ years', min: 16, max: 100 }
    ]

    const experienceBreakdown = experienceRanges.map(range => {
      const count = filteredEmployees.filter(emp => {
        const years = emp.years_experience || 0
        return years >= range.min && (range.max === 100 ? true : years <= range.max)
      }).length
      
      return {
        range: range.range,
        count,
        percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
      }
    })

    // Average rate calculation
    const validRates = filteredEmployees
      .map(emp => emp.hourly_rate ? Number(emp.hourly_rate) : 0)
      .filter(rate => rate > 0)
    const averageRate = validRates.length > 0 
      ? Math.round(validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length)
      : 0

    // Top skills analysis
    const skillStats = new Map<string, { total: number, expert: number }>()
    filteredEmployees.forEach(emp => {
      emp.skills.forEach(skill => {
        const current = skillStats.get(skill.name) || { total: 0, expert: 0 }
        skillStats.set(skill.name, {
          total: current.total + 1,
          expert: current.expert + (skill.level === 'Expert' ? 1 : 0)
        })
      })
    })

    const topSkills = Array.from(skillStats.entries())
      .map(([skill, stats]) => ({
        skill,
        totalCount: stats.total,
        expertCount: stats.expert
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10)

    // Security clearance breakdown
    const clearanceStats = new Map<string, number>()
    filteredEmployees.forEach(emp => {
      const clearance = emp.security_clearance || 'None'
      clearanceStats.set(clearance, (clearanceStats.get(clearance) || 0) + 1)
    })

    const securityClearanceBreakdown = Array.from(clearanceStats.entries()).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / totalEmployees) * 100)
    }))

    // Team cost analysis (mock data for now)
    const teamCostAnalysis = {
      averageTeamCost: 25000, // €25k average monthly team cost
      costByCategory: categoryBreakdown.slice(0, 5).map(cat => ({
        category: cat.category,
        cost: Math.round(cat.count * averageRate * 160) // rough monthly cost estimation
      })),
      costTrends: [] // Would need historical data
    }

    // Gap analysis (mock critical gaps for demonstration)
    const gapAnalysis = {
      criticalGaps: [
        { skill: 'Senior Project Manager', required: 5, available: 2 },
        { skill: 'Water Treatment Specialist', required: 8, available: 4 },
        { skill: 'Security Cleared Engineer', required: 10, available: 6 },
        { skill: 'Infrastructure Architect', required: 3, available: 1 }
      ],
      categoryGaps: categoryBreakdown.map(cat => ({
        category: cat.category,
        coverage: Math.min(100, (cat.count / Math.max(1, cat.count * 1.2)) * 100), // Mock coverage calculation
        gap: Math.max(0, (cat.count * 0.2)) // Mock gap calculation
      }))
    }

    const capabilityReport = {
      totalEmployees,
      availableEmployees,
      keyExperts,
      categoryBreakdown,
      experienceBreakdown,
      averageRate,
      topSkills,
      securityClearanceBreakdown
    }

    const analyticsData = {
      capabilityReport,
      teamCostAnalysis,
      gapAnalysis
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}