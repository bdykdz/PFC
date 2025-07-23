import { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false
      
      try {
        // Find user by Azure ID or email
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { azure_id: account.providerAccountId },
              { email: user.email! }
            ]
          }
        })
        
        if (!existingUser) {
          // User not imported via setup - reject sign in
          return false
        }
        
        // Update Azure ID if not set and update last login
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            ...(existingUser.azure_id ? {} : { azure_id: account.providerAccountId }),
            last_login: new Date()
          }
        })
        
        // Log successful login
        await logActivity({
          userId: existingUser.id,
          action: 'user.login',
          resourceType: 'user',
          resourceId: existingUser.id
        })
        
        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user?.email) {
        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        // Get user from database on first sign in
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 5 * 24 * 60 * 60, // 5 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}