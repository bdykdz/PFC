import { NextResponse } from 'next/server'
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'

async function getGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.AZURE_AD_TENANT_ID!,
    process.env.AZURE_AD_CLIENT_ID!,
    process.env.AZURE_AD_CLIENT_SECRET!
  )

  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token?.token || ''
      },
    },
  })

  return client
}

export async function POST() {
  try {
    const client = await getGraphClient()
    
    let allUsers: any[] = []
    
    console.log('Starting to fetch ALL users from Azure AD...')
    
    // First request
    let response = await client
      .api('/users')
      .select('id,displayName,mail,jobTitle,department,userPrincipalName')
      .top(999) // Maximum allowed by Graph API
      .orderby('displayName')
      .get()
    
    allUsers = response.value || []
    console.log(`First batch: ${allUsers.length} users`)
    
    // Keep fetching while there's a nextLink
    let pageCount = 1
    while (response['@odata.nextLink']) {
      pageCount++
      console.log(`Fetching page ${pageCount}...`)
      
      // Use the full nextLink URL provided by Graph API
      response = await client.api(response['@odata.nextLink']).get()
      
      if (response.value && response.value.length > 0) {
        allUsers = allUsers.concat(response.value)
        console.log(`Page ${pageCount}: ${response.value.length} users (Total: ${allUsers.length})`)
      }
    }
    
    const users = allUsers.map((user: any) => ({
      id: user.id,
      name: user.displayName || user.userPrincipalName || user.mail || 'Unknown User',
      email: user.mail || user.userPrincipalName || '',
      jobTitle: user.jobTitle || '',
      department: user.department || '',
    }))
    
    console.log(`COMPLETED: Fetched ${users.length} total users from Azure AD in ${pageCount} page(s)`)
    
    return NextResponse.json({ 
      users,
      totalCount: users.length,
      pagesFetched: pageCount
    })
  } catch (error) {
    console.error('Error fetching Azure AD users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users from Azure AD' },
      { status: 500 }
    )
  }
}