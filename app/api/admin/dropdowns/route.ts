import { NextRequest, NextResponse } from 'next/server'
import { checkUserRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkUserRole(['admin', 'editor'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all unique dropdown values
    const [departments, companies, contracts, skills, diplomas] = await Promise.all([
      prisma.employee.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ['department'],
      }),
      
      prisma.employee.findMany({
        where: { company: { not: null } },
        select: { company: true },
        distinct: ['company'],
      }),
      
      prisma.contract.findMany({
        select: { 
          position: true,
          location: true,
          beneficiary: true,
        },
      }),
      
      prisma.skill.findMany({
        select: { name: true },
        distinct: ['name'],
      }),
      
      prisma.diploma.findMany({
        select: { 
          name: true,
          issuer: true,
        },
      }),
    ])

    const result = {
      departments: departments.map(d => d.department).filter(Boolean).sort(),
      companies: companies.map(c => c.company).filter(Boolean).sort(),
      positions: Array.from(new Set(contracts.map(c => c.position).filter(Boolean))).sort(),
      locations: Array.from(new Set(contracts.map(c => c.location).filter(Boolean))).sort(),
      beneficiaries: Array.from(new Set(contracts.map(c => c.beneficiary).filter(Boolean))).sort(),
      skill_names: Array.from(new Set(skills.map(s => s.name))).sort(),
      diploma_names: Array.from(new Set(diplomas.map(d => d.name))).sort(),
      diploma_issuers: Array.from(new Set(diplomas.map(d => d.issuer))).sort(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching dropdown data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dropdown data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, session } = await checkUserRole(['admin', 'editor'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { type, action, value, oldValue } = body

    switch (action) {
      case 'add':
        await addDropdownValue(type, value, session?.user?.id)
        break
      case 'update':
        await updateDropdownValue(type, oldValue, value, session?.user?.id)
        break
      case 'delete':
        await deleteDropdownValue(type, value, session?.user?.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing dropdown:', error)
    return NextResponse.json(
      { error: 'Failed to manage dropdown' },
      { status: 500 }
    )
  }
}

async function addDropdownValue(type: string, value: string, userId: string | undefined) {
  // For now, we'll just log this action. In a real implementation, you might
  // want to maintain separate tables for dropdown options or update existing records
  
  await logActivity({
    userId: userId || null,
    action: 'dropdown.added' as any,
    resourceType: 'system',
    changes: {
      type,
      value,
      action: 'add'
    }
  })

  // Since we don't have separate dropdown tables, we'll just return success
  // The actual values are pulled dynamically from the existing data
  return true
}

async function updateDropdownValue(type: string, oldValue: string, newValue: string, userId: string | undefined) {
  // Update the actual data in the database
  switch (type) {
    case 'departments':
      await prisma.employee.updateMany({
        where: { department: oldValue },
        data: { department: newValue }
      })
      break
    case 'companies':
      await prisma.employee.updateMany({
        where: { company: oldValue },
        data: { company: newValue }
      })
      break
    case 'positions':
      await prisma.contract.updateMany({
        where: { position: oldValue },
        data: { position: newValue }
      })
      break
    case 'locations':
      await prisma.contract.updateMany({
        where: { location: oldValue },
        data: { location: newValue }
      })
      break
    case 'beneficiaries':
      await prisma.contract.updateMany({
        where: { beneficiary: oldValue },
        data: { beneficiary: newValue }
      })
      break
    case 'skill_names':
      await prisma.skill.updateMany({
        where: { name: oldValue },
        data: { name: newValue }
      })
      break
    case 'diploma_names':
      await prisma.diploma.updateMany({
        where: { name: oldValue },
        data: { name: newValue }
      })
      break
    case 'diploma_issuers':
      await prisma.diploma.updateMany({
        where: { issuer: oldValue },
        data: { issuer: newValue }
      })
      break
  }

  await logActivity({
    userId: userId || null,
    action: 'dropdown.updated' as any,
    resourceType: 'system',
    changes: {
      type,
      oldValue,
      newValue,
      action: 'update'
    }
  })

  return true
}

async function deleteDropdownValue(type: string, value: string, userId: string | undefined) {
  // For delete, we'll set the value to null rather than actually deleting records
  // This preserves data integrity
  
  switch (type) {
    case 'departments':
      await prisma.employee.updateMany({
        where: { department: value },
        data: { department: null }
      })
      break
    case 'companies':
      await prisma.employee.updateMany({
        where: { company: value },
        data: { company: null }
      })
      break
    case 'positions':
      await prisma.contract.updateMany({
        where: { position: value },
        data: { position: null }
      })
      break
    case 'locations':
      await prisma.contract.updateMany({
        where: { location: value },
        data: { location: null }
      })
      break
    case 'beneficiaries':
      await prisma.contract.updateMany({
        where: { beneficiary: value },
        data: { beneficiary: null }
      })
      break
    case 'skill_names':
      // For skills, we'll actually delete them since they're more tightly coupled
      await prisma.skill.deleteMany({
        where: { name: value }
      })
      break
    case 'diploma_names':
      // For diplomas, we'll set to a default value
      await prisma.diploma.updateMany({
        where: { name: value },
        data: { name: 'Deleted Diploma' }
      })
      break
    case 'diploma_issuers':
      await prisma.diploma.updateMany({
        where: { issuer: value },
        data: { issuer: 'Unknown Issuer' }
      })
      break
  }

  await logActivity({
    userId: userId || null,
    action: 'dropdown.deleted' as any,
    resourceType: 'system',
    changes: {
      type,
      value,
      action: 'delete'
    }
  })

  return true
}