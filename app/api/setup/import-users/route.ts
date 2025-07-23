import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ImportUser {
  id: string
  email: string
  name: string
  jobTitle?: string
  department?: string
}

export async function POST(request: Request) {
  try {
    const { allAzureUsers, selectedUserIds, adminUserId } = await request.json()
    
    if (!allAzureUsers || allAzureUsers.length === 0) {
      return NextResponse.json(
        { error: 'No Azure users provided' },
        { status: 400 }
      )
    }
    
    if (!selectedUserIds || selectedUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No users selected for login access' },
        { status: 400 }
      )
    }
    
    if (!adminUserId || !selectedUserIds.includes(adminUserId)) {
      return NextResponse.json(
        { error: 'Admin user must be selected from the users with login access' },
        { status: 400 }
      )
    }
    
    // Import users and employees in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdUsers = []
      const createdEmployees = []
      
      // First, create Employee records for ALL Azure users
      for (const azureUser of allAzureUsers as ImportUser[]) {
        const employee = await tx.employee.create({
          data: {
            name: azureUser.name,
            email: azureUser.email,
            azure_id: azureUser.id,
            department: azureUser.department || null,
            expertise: azureUser.jobTitle || null,
          },
        })
        
        createdEmployees.push(employee)
      }
      
      // Then, create User records only for selected users
      for (const userId of selectedUserIds) {
        const azureUser = allAzureUsers.find((u: ImportUser) => u.id === userId)
        if (!azureUser) continue
        
        const role = userId === adminUserId ? 'admin' : 'viewer'
        
        const createdUser = await tx.user.create({
          data: {
            email: azureUser.email,
            name: azureUser.name,
            azure_id: azureUser.id,
            role,
          },
        })
        
        createdUsers.push(createdUser)
      }
      
      // Create audit log for setup completion
      await tx.auditLog.create({
        data: {
          action: 'SETUP_COMPLETED',
          resource_type: 'system',
          resource_id: null,
          changes: {
            employees_created: createdEmployees.length,
            users_created: createdUsers.length,
            admin_user_id: adminUserId,
          },
        },
      })
      
      return {
        users: createdUsers,
        employees: createdEmployees,
      }
    })
    
    return NextResponse.json({
      success: true,
      employeesCreated: result.employees.length,
      usersCreated: result.users.length,
    })
  } catch (error) {
    console.error('Error importing users:', error)
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    )
  }
}