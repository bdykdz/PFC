import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const importUsersSchema = z.object({
  users: z.array(z.object({
    azureId: z.string(),
    email: z.string().email(),
    name: z.string(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    role: z.enum(['viewer', 'editor', 'manager', 'admin']).default('viewer'),
    contractType: z.enum(['CIM', 'PFA', 'SRL']).optional()
  }))
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { users } = importUsersSchema.parse(body)

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[]
    }

    // Process users in batches to avoid overwhelming the database
    for (const user of users) {
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
          where: { email: user.email }
        })

        if (existingEmployee) {
          // Update existing employee
          await prisma.employee.update({
            where: { email: user.email },
            data: {
              azure_id: user.azureId,
              name: user.name,
              department: user.department,
              contract_type: user.contractType,
              expertise: user.jobTitle,
              updated_by_id: session.user.id,
              updated_at: new Date()
            }
          })
          results.updated++
        } else {
          // Create new employee
          await prisma.employee.create({
            data: {
              email: user.email,
              name: user.name,
              azure_id: user.azureId,
              department: user.department,
              contract_type: user.contractType,
              expertise: user.jobTitle,
              created_by_id: session.user.id,
              updated_by_id: session.user.id
            }
          })
          results.imported++
        }

        // If the user should also have login access, create/update user record
        if (['admin', 'manager', 'editor'].includes(user.role)) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                azure_id: user.azureId,
                role: user.role
              }
            })
          } else {
            await prisma.user.update({
              where: { email: user.email },
              data: {
                role: user.role,
                azure_id: user.azureId
              }
            })
          }
        }

        // Log the import action
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: existingEmployee ? 'UPDATE_EMPLOYEE_IMPORT' : 'CREATE_EMPLOYEE_IMPORT',
            resource_type: 'employees',
            resource_id: existingEmployee?.id || user.azureId,
            changes: {
              email: user.email,
              name: user.name,
              department: user.department,
              source: 'azure_ad_import'
            }
          }
        })
      } catch (error) {
        results.failed++
        results.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error importing employees:', error)
    return NextResponse.json(
      { error: 'Failed to import employees' },
      { status: 500 }
    )
  }
}