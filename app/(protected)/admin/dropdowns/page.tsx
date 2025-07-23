import { Metadata } from 'next'
import { checkUserRole } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { DropdownsClient } from './dropdowns-client'

export const metadata: Metadata = {
  title: 'Manage Dropdowns',
  description: 'Manage dropdown options used throughout the system',
}

export default async function DropdownsPage() {
  const { authorized } = await checkUserRole(['admin', 'editor'])
  
  if (!authorized) {
    redirect('/search')
  }

  return <DropdownsClient />
}