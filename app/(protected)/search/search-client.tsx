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
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('search.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('search.subtitle')}
          </p>
        </div>
        <Button 
          onClick={() => router.push('/add-person')}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {t('people.addPerson')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('search.advancedSearch')}
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('search.browseAll')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <AdvancedSearchV3 />
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <EmployeeTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}