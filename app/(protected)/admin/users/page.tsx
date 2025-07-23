import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import UsersClient from './users-client'

export const metadata: Metadata = {
  title: 'Users Management',
  description: 'Manage user accounts and permissions',
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    redirect('/search')
  }

  return <UsersClient />
}