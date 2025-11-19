import { Metadata } from 'next'
import { TenderBuilderClient } from './tender-builder-client'

export const metadata: Metadata = {
  title: 'Tender Team Builder',
  description: 'Build project teams for tender submissions',
}

export default function TenderBuilderPage() {
  return <TenderBuilderClient />
}