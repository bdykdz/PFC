'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UserPlus, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EmployeeTable from './employee-table'
import AdvancedSearchV3 from './advanced-search-v3'

export function SearchClient() {
  const { t } = useI18n()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('search')

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('search.title')}</h1>
          <p className="text-muted-foreground">
            {t('search.subtitle')}
          </p>
        </div>
        <Button 
          onClick={() => router.push('/add-person')}
          className="flex items-center gap-2 w-fit"
          size="default"
        >
          <UserPlus className="h-4 w-4" />
          {t('people.addPerson')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t('search.advancedSearch')}</span>
            <span className="sm:hidden">Search</span>
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('search.browseAll')}</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <AdvancedSearchV3 />
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <EmployeeTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}