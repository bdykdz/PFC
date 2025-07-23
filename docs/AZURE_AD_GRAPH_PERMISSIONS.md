# Azure AD Microsoft Graph Permissions Setup

To enable user import functionality, you need to configure Microsoft Graph API permissions.

## Required Permissions

### 1. Add Microsoft Graph Permissions

1. Go to your app registration in Azure Portal
2. Navigate to **API permissions**
3. Click **Add a permission**
4. Select **Microsoft Graph**
5. Choose **Application permissions** (not Delegated)
6. Add these permissions:
   - `User.Read.All` - Read all users' full profiles
   - `Directory.Read.All` - Read directory data (optional, for more details)

### 2. Grant Admin Consent

1. After adding permissions, you'll see them listed with a warning icon
2. Click **Grant admin consent for [Your Organization]**
3. Confirm the consent
4. The Status column should now show green checkmarks

### 3. Update Environment Variables

No additional environment variables needed - the existing Azure AD credentials will be used.

## Testing the Import

1. Navigate to `/admin/setup` when logged in as an admin
2. Search for users by name or email
3. Select users to import
4. Assign roles and contract types
5. Click Import

## Permissions Explained

- **User.Read.All**: Allows the app to read user profiles without a signed-in user. This is needed to fetch the list of Azure AD users for import.
- **Directory.Read.All**: (Optional) Provides additional directory information like groups, organizational units, etc.

## Security Notes

- These are application-level permissions, not delegated
- The app can only read user data, not modify it
- Access is still controlled by your app's RBAC system
- Only users with 'admin' role can access the import functionality

## Troubleshooting

**"Insufficient privileges" error**
- Ensure admin consent was granted
- Wait 5-10 minutes for permissions to propagate
- Check the app has the correct permissions in Azure Portal

**"No users found"**
- Verify User.Read.All permission is granted
- Check there are users in your Azure AD tenant
- Try searching without filters first

**"Failed to fetch users"**
- Check application logs for detailed error messages
- Verify client credentials are correct
- Ensure the app registration is in the correct tenant