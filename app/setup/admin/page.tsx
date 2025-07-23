import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminSelectionClient from './admin-selection-client'

export default async function AdminSelectionPage() {
  const session = await getServerSession(authOptions)
  
  // Check if any users exist
  const userCount = await prisma.user.count()
  
  // If users exist and current user is not admin, redirect
  if (userCount > 0) {
    if (!session || session.user.role !== 'admin') {
      redirect('/search')
    }
  }
  
  return <AdminSelectionClient />
}