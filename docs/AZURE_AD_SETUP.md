# Azure AD Configuration Guide

## Step-by-Step Azure AD Setup

### 1. Access Azure Portal
1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft account that has Azure AD access

### 2. Register New Application

1. Navigate to **Azure Active Directory**
   - Click on "Azure Active Directory" in the left sidebar
   - Or search for "Azure Active Directory" in the top search bar

2. Go to **App registrations**
   - In the Azure AD menu, click on "App registrations"
   - Click "New registration" button

3. Fill in application details:
   - **Name**: `People Finder` (or your preferred name)
   - **Supported account types**: Choose based on your needs:
     - "Accounts in this organizational directory only" (Single tenant - most common)
     - "Accounts in any organizational directory" (Multi-tenant)
     - "Accounts in any organizational directory and personal Microsoft accounts" (Multi-tenant + personal)
   - **Redirect URI**: 
     - Platform: `Web`
     - URI: `http://localhost:3000/api/auth/callback/azure-ad`
   - Click "Register"

### 3. Configure Authentication

1. After registration, you'll be on the app's Overview page
2. Go to **Authentication** in the left menu
3. Add additional redirect URIs if needed:
   - For production: `https://yourdomain.com/api/auth/callback/azure-ad`
   - For Docker: `http://localhost:3000/api/auth/callback/azure-ad`
4. Under "Implicit grant and hybrid flows":
   - Check "ID tokens" (used for implicit and hybrid flows)
5. Click "Save"

### 4. Create Client Secret

1. Go to **Certificates & secrets** in the left menu
2. Click "New client secret"
3. Add a description: `People Finder Secret`
4. Choose expiration:
   - 6 months
   - 12 months
   - 24 months
   - Custom (set your own)
5. Click "Add"
6. **IMPORTANT**: Copy the secret value immediately! You won't be able to see it again.
   ```
   Client Secret Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 5. Collect Required Information

From the **Overview** page, copy these values:

1. **Application (client) ID**: 
   ```
   Example: 12345678-1234-1234-1234-123456789012
   ```

2. **Directory (tenant) ID**:
   ```
   Example: 87654321-4321-4321-4321-210987654321
   ```

3. **Client Secret** (from step 4):
   ```
   Example: abcdefghijklmnopqrstuvwxyz123456
   ```

### 6. Configure API Permissions (Optional but Recommended)

1. Go to **API permissions** in the left menu
2. The following permissions should already be granted:
   - `User.Read` (Sign in and read user profile)
3. If you need additional permissions, click "Add a permission"
4. Common additions:
   - `email` - Access user's email
   - `profile` - Access user's basic profile
   - `offline_access` - Maintain access to data you have given it access to

### 7. Update Your .env File

Add these values to your `.env` file:

```env
# Microsoft Azure AD
AZURE_AD_CLIENT_ID="12345678-1234-1234-1234-123456789012"
AZURE_AD_CLIENT_SECRET="abcdefghijklmnopqrstuvwxyz123456"
AZURE_AD_TENANT_ID="87654321-4321-4321-4321-210987654321"
```

### 8. Test the Configuration

1. Start your application:
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Sign in with Microsoft"
4. You should be redirected to Microsoft login
5. After successful login, you'll be redirected back to your app

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**
   - Error: `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`
   - Solution: Ensure the redirect URI in Azure exactly matches your NextAuth configuration

2. **Invalid client secret**
   - Error: `AADSTS7000215: Invalid client secret is provided`
   - Solution: Generate a new client secret and update your .env file

3. **Tenant not found**
   - Error: `AADSTS90002: Tenant not found`
   - Solution: Verify your tenant ID is correct

4. **Insufficient permissions**
   - Error: `AADSTS65001: The user or administrator has not consented to use the application`
   - Solution: Grant admin consent in API permissions or have users consent individually

### Production Considerations

1. **Use HTTPS in production**
   - Update redirect URI to use `https://`
   - Azure AD requires HTTPS for production apps

2. **Secret rotation**
   - Set calendar reminders before secret expiration
   - Keep multiple valid secrets during rotation period

3. **Conditional Access**
   - Configure policies for MFA, device compliance, etc.
   - Test policies with pilot groups first

4. **Monitor sign-in logs**
   - Check Azure AD sign-in logs regularly
   - Set up alerts for suspicious activities

## Additional Resources

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [NextAuth.js Azure AD Provider](https://next-auth.js.org/providers/azure-ad)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)