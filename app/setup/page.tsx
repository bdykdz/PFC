import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SetupClient from './setup-client'

export default async function SetupPage() {
  // Check if any users exist
  const userCount = await prisma.user.count()
  
  // If users exist, check session
  if (userCount > 0) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      redirect('/search')
    }
  }
  
  // Check if setup is complete
  const setupComplete = userCount > 0
  
  return <SetupClient initialSetupComplete={setupComplete} />
}