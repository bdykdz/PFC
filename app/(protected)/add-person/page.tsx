import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import AddPersonClient from './add-person-client'

export const dynamic = 'force-dynamic'

export default async function AddPersonPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/search')
  }

  return <AddPersonClient />
}