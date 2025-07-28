import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's saved searches
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        user_id: session.user.id
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform the data to match the frontend format
    const formattedSearches = savedSearches.map(search => ({
      id: search.id,
      name: search.name,
      queries: search.queries,
      created_at: search.created_at
    }))

    return NextResponse.json(formattedSearches)
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

// POST - Create a new saved search
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    if (!session.user?.id) {
      console.error('Session user missing ID:', session.user)
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 })
    }

    const body = await request.json()
    const { name, queries } = body

    if (!name || !queries) {
      return NextResponse.json(
        { error: 'Name and queries are required' },
        { status: 400 }
      )
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        user_id: session.user.id,
        name,
        queries
      }
    })

    return NextResponse.json({
      id: savedSearch.id,
      name: savedSearch.name,
      queries: savedSearch.queries,
      created_at: savedSearch.created_at
    })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved search
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get('id')

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Verify the search belongs to the user
    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: searchId,
        user_id: session.user.id
      }
    })

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    await prisma.savedSearch.delete({
      where: {
        id: searchId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}