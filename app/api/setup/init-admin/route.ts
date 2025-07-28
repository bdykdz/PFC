import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      return NextResponse.json({ error: 'Users already exist' }, { status: 400 })
    }

    const { email, name, azureId } = await request.json()

    if (!email || !name || !azureId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the first admin user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        azure_id: azureId,
        role: 'admin',
        status: 'active'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}