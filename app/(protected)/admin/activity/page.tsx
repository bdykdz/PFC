import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import ActivityClient from './activity-client'

export const metadata: Metadata = {
  title: 'Activity Log',
  description: 'View system activity and audit logs',
}

export default async function ActivityPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    redirect('/search')
  }

  return <ActivityClient />
}