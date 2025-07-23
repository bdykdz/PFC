import { validateAdminSession } from '@/lib/admin-utils'
import { redirect } from 'next/navigation'
import AdminUserEdit from './admin-user-edit'

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const adminUser = await validateAdminSession()
  
  if (!adminUser) {
    redirect('/search')
  }

  const { id } = await params

  return <AdminUserEdit userId={id} isNewUser={id === 'new'} />
}