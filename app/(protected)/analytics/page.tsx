import { Metadata } from 'next'
import { AnalyticsDashboard } from './analytics-client'

export const metadata: Metadata = {
  title: 'Capability Analytics | People Finder',
  description: 'Comprehensive analytics and reporting for tender preparation and team capability assessment',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}