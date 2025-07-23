# Setting Up HTTPS for Local Development

## Option 1: Using mkcert (Recommended - Easiest)

1. **Install mkcert**:
   ```bash
   # macOS
   brew install mkcert
   brew install nss # for Firefox support
   
   # Windows
   choco install mkcert
   
   # Linux
   # Download from https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create local CA**:
   ```bash
   mkcert -install
   ```

3. **Generate certificate**:
   ```bash
   cd certificates
   mkcert localhost 127.0.0.1 ::1
   ```

4. **Run with HTTPS**:
   ```bash
   npm run dev:https
   ```

## Option 2: Using the self-signed certificate (Already created)

The certificate is already created in the `certificates` folder. However, your browser will show a security warning.

To bypass the warning:
- Chrome: Type "thisisunsafe" on the warning page
- Firefox: Click "Advanced" → "Accept the Risk and Continue"
- Safari: Click "Show Details" → "visit this website"

## Option 3: Quick Solution - Use ngrok

1. Install ngrok: https://ngrok.com/download
2. Run your app normally: `docker-compose up -d`
3. In another terminal: `ngrok http 3010`
4. Use the HTTPS URL provided by ngrok

## Update Azure AD

Once you have HTTPS working locally, update your Azure AD app:

1. **Redirect URI**: `https://localhost:3443/api/auth/callback/azure-ad`
2. **Front-channel logout URL**: `https://localhost:3443/api/auth/signout`

## Update your .env file

```env
NEXTAUTH_URL="https://localhost:3443"
```

## Run with HTTPS Docker

```bash
docker-compose -f docker-compose-https.yml up -d --build
```

The app will be available at https://localhost:3443