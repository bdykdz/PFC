import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LandingClient } from './landing-client'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Check if any users exist for initial setup
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    redirect('/setup')
  }

  // Check if user is already logged in
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/search')
  }

  return <LandingClient />
}