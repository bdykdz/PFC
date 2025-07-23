import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

export interface AzureADUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
  officeLocation?: string
  mobilePhone?: string
  businessPhones?: string[]
  givenName?: string
  surname?: string
}

let graphClient: Client | null = null

export function getGraphClient(): Client {
  if (!graphClient) {
    const credential = new ClientSecretCredential(
      process.env.AZURE_AD_TENANT_ID!,
      process.env.AZURE_AD_CLIENT_ID!,
      process.env.AZURE_AD_CLIENT_SECRET!
    )

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    })

    graphClient = Client.initWithMiddleware({
      authProvider: authProvider
    })
  }

  return graphClient
}

export async function fetchAzureADUsers(pageSize: number = 100): Promise<{
  users: AzureADUser[]
  nextLink?: string
}> {
  try {
    const client = getGraphClient()
    
    const response = await client
      .api('/users')
      .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,givenName,surname')
      .top(pageSize)
      .get()

    return {
      users: response.value || [],
      nextLink: response['@odata.nextLink']
    }
  } catch (error) {
    console.error('Error fetching Azure AD users:', error)
    throw new Error('Failed to fetch users from Azure AD')
  }
}

export async function fetchAzureADUsersByPage(nextLink: string): Promise<{
  users: AzureADUser[]
  nextLink?: string
}> {
  try {
    const client = getGraphClient()
    const response = await client.api(nextLink).get()

    return {
      users: response.value || [],
      nextLink: response['@odata.nextLink']
    }
  } catch (error) {
    console.error('Error fetching Azure AD users by page:', error)
    throw new Error('Failed to fetch users from Azure AD')
  }
}

export async function searchAzureADUsers(searchTerm: string): Promise<AzureADUser[]> {
  try {
    const client = getGraphClient()
    
    const response = await client
      .api('/users')
      .filter(`startsWith(displayName,'${searchTerm}') or startsWith(mail,'${searchTerm}') or startsWith(userPrincipalName,'${searchTerm}')`)
      .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,givenName,surname')
      .top(50)
      .get()

    return response.value || []
  } catch (error) {
    console.error('Error searching Azure AD users:', error)
    throw new Error('Failed to search users in Azure AD')
  }
}