import { NextRequest, NextResponse } from 'next/server'
import { checkUserRole } from '@/lib/auth-utils'
import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { authorized } = await checkUserRole(['admin'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get Azure AD credentials from environment
    const tenantId = process.env.AZURE_AD_TENANT_ID
    const clientId = process.env.AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET

    if (!tenantId || !clientId || !clientSecret) {
      console.error('Missing Azure AD configuration')
      return NextResponse.json({ error: 'Azure AD not configured' }, { status: 500 })
    }

    // Create credential and auth provider
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    })

    // Initialize Graph client
    const graphClient = Client.initWithMiddleware({
      authProvider: authProvider
    })

    // Search users in Azure AD
    const searchFilter = `startswith(displayName,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`
    
    const result = await graphClient
      .api('/users')
      .filter(searchFilter)
      .select(['id', 'displayName', 'mail', 'userPrincipalName', 'jobTitle', 'department', 'officeLocation'])
      .top(20)
      .get()

    const users = result.value || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching Azure AD:', error)
    return NextResponse.json(
      { error: 'Failed to search Azure AD users' },
      { status: 500 }
    )
  }
}