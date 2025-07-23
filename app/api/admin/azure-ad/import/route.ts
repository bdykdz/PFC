import { NextRequest, NextResponse } from 'next/server'
import { checkUserRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

interface AzureADUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { authorized, session } = await checkUserRole(['admin'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { users }: { users: AzureADUser[] } = body

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users to import' }, { status: 400 })
    }

    let imported = 0
    let updated = 0
    let failed = 0
    const errors: string[] = []

    // Process each user
    for (const azureUser of users) {
      try {
        const email = azureUser.mail || azureUser.userPrincipalName
        
        if (!email) {
          failed++
          errors.push(`No email for user ${azureUser.displayName}`)
          continue
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: azureUser.displayName,
              azure_id: azureUser.id,
            }
          })
          updated++
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email,
              name: azureUser.displayName,
              azure_id: azureUser.id,
              role: 'viewer', // Default role for imported users
              status: 'active',
            }
          })
          imported++

          // Log the activity
          await logActivity({
            action: 'user.imported',
            resourceType: 'user',
            resourceId: newUser.id,
            userId: session?.user?.id || null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            changes: {
              from_azure_ad: true,
              azure_id: azureUser.id
            }
          })
        }
      } catch (error) {
        console.error(`Error importing user ${azureUser.displayName}:`, error)
        failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to import ${azureUser.displayName}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      failed,
      errors
    })
  } catch (error) {
    console.error('Error importing Azure AD users:', error)
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    )
  }
}