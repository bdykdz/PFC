# Azure AD Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Register App
1. Go to [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Fill in:
   - Name: `People Finder`
   - Account types: `Single tenant` (recommended)
   - Redirect URI: `Web` → `http://localhost:3000/api/auth/callback/azure-ad`
3. Click Register

### Step 2: Create Secret
1. Go to Certificates & secrets → New client secret
2. Description: `People Finder Secret`
3. Expires: Choose duration
4. Click Add
5. **Copy the secret value immediately!**

### Step 3: Copy Your Values
From the Overview page, copy:
- Application (client) ID
- Directory (tenant) ID
- Client Secret (from step 2)

### Step 4: Configure .env
```env
AZURE_AD_CLIENT_ID="your-client-id-here"
AZURE_AD_CLIENT_SECRET="your-client-secret-here"
AZURE_AD_TENANT_ID="your-tenant-id-here"
```

### Step 5: Test
```bash
docker-compose up -d
npm run dev
```
Visit http://localhost:3000 and sign in!

## 📝 Production Checklist

- [ ] Add production redirect URI: `https://yourdomain.com/api/auth/callback/azure-ad`
- [ ] Enable HTTPS only
- [ ] Set up secret rotation reminder
- [ ] Configure Conditional Access policies
- [ ] Test with non-admin users

## 🔧 Common Fixes

**"Redirect URI mismatch"**
→ Add exact URL to Authentication → Redirect URIs

**"Invalid client secret"**
→ Generate new secret, update .env

**"User not authorized"**
→ Check user has license/access to app

## 📞 Need Help?

- Check sign-in logs in Azure AD
- Enable debug mode: `DEBUG=next-auth:*`
- Review [NextAuth Azure AD docs](https://next-auth.js.org/providers/azure-ad)