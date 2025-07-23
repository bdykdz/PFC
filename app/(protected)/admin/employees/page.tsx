import { Metadata } from 'next'
import { checkUserRole } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { EmployeesClient } from './employees-client'

export const metadata: Metadata = {
  title: 'Manage Employees',
  description: 'Manage employee profiles and data',
}

export default async function EmployeesPage() {
  const { authorized } = await checkUserRole(['admin', 'editor'])
  
  if (!authorized) {
    redirect('/search')
  }

  return <EmployeesClient />
}