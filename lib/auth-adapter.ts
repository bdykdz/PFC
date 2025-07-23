import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

// Create a new Prisma instance specifically for NextAuth
const authPrisma = new PrismaClient({
  log: ['error', 'warn'],
})

export const authAdapter = PrismaAdapter(authPrisma)