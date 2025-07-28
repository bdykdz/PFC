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

    // Get custom dropdown values from audit log
    const customValueLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          {
            action: 'DROPDOWN_VALUE_ADDED',
            resource_type: 'dropdown'
          },
          {
            action: 'DROPDOWN_VALUE_DELETED',
            resource_type: 'dropdown'
          }
        ]
      },
      select: {
        action: true,
        resource_id: true,
        changes: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Track active custom values by type
    const customValuesByType: Record<string, Set<string>> = {}
    
    customValueLogs.forEach(log => {
      const type = log.resource_id
      const changes = log.changes as any
      if (type && changes?.value) {
        if (!customValuesByType[type]) {
          customValuesByType[type] = new Set()
        }
        
        if (log.action === 'DROPDOWN_VALUE_ADDED') {
          customValuesByType[type].add(changes.value)
        } else if (log.action === 'DROPDOWN_VALUE_DELETED') {
          customValuesByType[type].delete(changes.value)
        }
      }
    })

    // Merge dynamic and custom values
    const result = {
      departments: Array.from(new Set([
        ...departments.map(d => d.department).filter(Boolean),
        ...(customValuesByType.departments || new Set())
      ])).sort(),
      companies: Array.from(new Set([
        ...companies.map(c => c.company).filter(Boolean),
        ...(customValuesByType.companies || new Set())
      ])).sort(),
      positions: Array.from(new Set([
        ...contracts.map(c => c.position).filter(Boolean),
        ...(customValuesByType.positions || new Set())
      ])).sort(),
      locations: Array.from(new Set([
        ...contracts.map(c => c.location).filter(Boolean),
        ...(customValuesByType.locations || new Set())
      ])).sort(),
      beneficiaries: Array.from(new Set([
        ...contracts.map(c => c.beneficiary).filter(Boolean),
        ...(customValuesByType.beneficiaries || new Set())
      ])).sort(),
      skill_names: Array.from(new Set([
        ...skills.map(s => s.name),
        ...(customValuesByType.skill_names || new Set())
      ])).sort(),
      diploma_names: Array.from(new Set([
        ...diplomas.map(d => d.name),
        ...(customValuesByType.diploma_names || new Set())
      ])).sort(),
      diploma_issuers: Array.from(new Set([
        ...diplomas.map(d => d.issuer),
        ...(customValuesByType.diploma_issuers || new Set())
      ])).sort(),
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
  // Since dropdown values are extracted dynamically from existing data,
  // we need to create placeholder records to make new values available
  
  try {
    // For all types, we store in audit log as custom dropdown values
    // These will be retrieved separately and merged with dynamic values
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action: 'DROPDOWN_VALUE_ADDED',
        resource_type: 'dropdown',
        resource_id: type,
        changes: {
          type,
          value,
          action: 'add',
          isCustomValue: true
        }
      }
    })
    
    return true
  } catch (error) {
    console.error('Error adding dropdown value:', error)
    throw error
  }
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
  // First, mark any custom values as deleted
  await prisma.auditLog.create({
    data: {
      user_id: userId || null,
      action: 'DROPDOWN_VALUE_DELETED',
      resource_type: 'dropdown',
      resource_id: type,
      changes: {
        type,
        value,
        action: 'delete',
        isCustomValue: true
      }
    }
  })
  
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