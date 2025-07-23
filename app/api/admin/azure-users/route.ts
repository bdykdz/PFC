import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { fetchAzureADUsers, searchAzureADUsers } from '@/lib/microsoft-graph'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = searchParams.get('page') || '1'
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    if (search) {
      const users = await searchAzureADUsers(search)
      return NextResponse.json({ users, totalCount: users.length })
    }

    const result = await fetchAzureADUsers(pageSize)
    
    return NextResponse.json({
      users: result.users,
      nextLink: result.nextLink,
      hasMore: !!result.nextLink
    })
  } catch (error) {
    console.error('Error in azure-users API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure AD users' },
      { status: 500 }
    )
  }
}