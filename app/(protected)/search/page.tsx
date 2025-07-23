import { Metadata } from 'next'
import { SearchClient } from './search-client'

export const metadata: Metadata = {
  title: 'Employee Directory',
  description: 'Browse and search all employees',
}

export default function SearchPage() {
  return <SearchClient />
}