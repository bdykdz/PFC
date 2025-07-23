# Azure AD Redirect URI Update Required

The application is now running on port **3010** instead of 3000. You need to update your Azure AD app registration:

## Steps to Update:

1. **Go to Azure Portal**
   - https://portal.azure.com

2. **Navigate to your App Registration**
   - Azure Active Directory → App registrations
   - Find your app: `482d809d-b447-444a-87a7-ea3769cdce7b`

3. **Update Redirect URIs**
   - Go to "Authentication" in the left sidebar
   - Under "Platform configurations" → "Web"
   - **Remove** the old URI: `http://localhost:3000/api/auth/callback/azure-ad`
   - **Add** the new URI: `http://localhost:3010/api/auth/callback/azure-ad`
   - Click "Save"

4. **Update Front-channel logout URL** (if configured)
   - Change from: `http://localhost:3000/api/auth/signout`
   - To: `http://localhost:3010/api/auth/signout`

## Production Redirect URIs

When deploying to production, also add:
- `https://your-domain.com/api/auth/callback/azure-ad`

## Troubleshooting

If you still get redirect URI errors:
1. Clear your browser cache and cookies
2. Make sure you saved the changes in Azure Portal
3. Wait 1-2 minutes for changes to propagate
4. Try an incognito/private browser window