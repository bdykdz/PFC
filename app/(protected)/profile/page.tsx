import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your personal profile and settings',
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return <ProfileClient session={session} />
}