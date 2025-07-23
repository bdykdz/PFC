'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Search,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  GraduationCap,
  Award,
  User,
  Mail,
  Phone,
  Eye,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Save,
  FolderOpen,
  Sparkles,
  Clock,
  Target,
  Users,
  Hash,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface QueryCondition {
  id: string
  field: string
  operator: string
  value: string | string[]
  logicalOperator: 'AND' | 'OR'
}

interface SearchResult {
  id: string
  name: string
  email: string
  phone: string | null
  department: string | null
  company: string | null
  expertise: string | null
  profile_image_url: string | null
  contract_type: string | null
  general_experience: string | null
  contracts_count: number
  active_contracts_count: number
  total_contract_value?: number
  current_contracts: Array<{
    id: string
    name: string
    position: string | null
    beneficiary: string | null
    location: string | null
    start_date: string
    end_date: string | null
  }>
  skills: Array<{
    id: string
    name: string
    level: string
    type: string
  }>
  diplomas_count: number
  recent_diplomas: Array<{
    id: string
    name: string
    issuer: string
    issue_date: string
  }>
}

interface FilterOptions {
  departments: string[]
  companies: string[]
  positions: string[]
  locations: string[]
  beneficiaries: string[]
  contract_types: string[]
  skill_names: string[]
  skill_levels: string[]
  diploma_names: string[]
  diploma_issuers: string[]
}

export default function AdvancedSearchV3() {
  const router = useRouter()
  const { t } = useI18n()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    companies: [],
    positions: [],
    locations: [],
    beneficiaries: [],
    contract_types: ['CIM', 'PFA', 'SRL'],
    skill_names: [],
    skill_levels: ['Beginner', 'Intermediate', 'Expert'],
    diploma_names: [],
    diploma_issuers: [],
  })
  
  const [queries, setQueries] = useState<QueryCondition[]>([
    {
      id: '1',
      field: 'name',
      operator: 'contains',
      value: '',
      logicalOperator: 'AND',
    }
  ])
  
  const [activeTab, setActiveTab] = useState('builder')
  const [showResults, setShowResults] = useState(false)
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; queries: QueryCondition[] }>>([])

  // Field options with translations
  const getFieldOptions = () => [
    { value: 'name', label: t('search.nameEmail'), icon: User },
    { value: 'skills', label: t('search.skills'), icon: Award },
    { value: 'skill_level', label: t('search.skillLevel'), icon: Target },
    { value: 'department', label: t('search.department'), icon: Building },
    { value: 'company', label: t('search.company'), icon: Building },
    { value: 'position', label: t('search.position'), icon: Briefcase },
    { value: 'location', label: t('search.location'), icon: MapPin },
    { value: 'beneficiary', label: t('search.clientBeneficiary'), icon: Users },
    { value: 'contract_type', label: t('search.contractType'), icon: FileText },
    { value: 'contracts_count', label: t('search.numberOfContracts'), icon: Hash },
    { value: 'active_contracts', label: t('search.activeContracts'), icon: FileText },
    { value: 'experience_years', label: t('search.yearsOfExperience'), icon: Clock },
    { value: 'contract_date', label: t('search.contractDateRange'), icon: Calendar },
    { value: 'diploma', label: t('search.diplomaCertification'), icon: GraduationCap },
    { value: 'diploma_issuer', label: t('search.diplomaIssuer'), icon: Building },
  ]

  // Operator options with translations
  const getOperatorOptions = (field: string) => {
    const operatorMap: Record<string, Array<{ value: string; label: string }>> = {
      name: [
        { value: 'contains', label: t('search.contains') },
        { value: 'exact', label: t('search.exactMatch') },
        { value: 'starts_with', label: t('search.startsWith') },
        { value: 'ends_with', label: t('search.endsWith') },
      ],
      skills: [
        { value: 'has_any', label: t('search.hasAnyOf') },
        { value: 'has_all', label: t('search.hasAllOf') },
        { value: 'not_has', label: t('search.doesNotHave') },
      ],
      skill_level: [
        { value: 'is', label: t('search.is') },
        { value: 'at_least', label: t('search.atLeast') },
      ],
      department: [
        { value: 'is', label: t('search.is') },
        { value: 'is_not', label: t('search.isNot') },
        { value: 'in', label: t('search.isOneOf') },
      ],
      company: [
        { value: 'is', label: t('search.is') },
        { value: 'is_not', label: t('search.isNot') },
        { value: 'in', label: t('search.isOneOf') },
      ],
      position: [
        { value: 'contains', label: t('search.contains') },
        { value: 'is', label: t('search.is') },
        { value: 'in', label: t('search.isOneOf') },
      ],
      location: [
        { value: 'is', label: t('search.is') },
        { value: 'in', label: t('search.isOneOf') },
        { value: 'contains', label: t('search.contains') },
      ],
      beneficiary: [
        { value: 'is', label: t('search.is') },
        { value: 'contains', label: t('search.contains') },
        { value: 'in', label: t('search.isOneOf') },
      ],
      contract_type: [
        { value: 'is', label: t('search.is') },
        { value: 'in', label: t('search.isOneOf') },
      ],
      contracts_count: [
        { value: 'equals', label: t('search.equals') },
        { value: 'greater_than', label: t('search.greaterThan') },
        { value: 'less_than', label: t('search.lessThan') },
        { value: 'between', label: t('search.between') },
      ],
      active_contracts: [
        { value: 'has', label: t('search.hasActiveContracts') },
        { value: 'no', label: t('search.noActiveContracts') },
        { value: 'count', label: t('search.activeCount') },
      ],
      experience_years: [
        { value: 'equals', label: t('search.equals') },
        { value: 'greater_than', label: t('search.greaterThan') },
        { value: 'less_than', label: t('search.lessThan') },
        { value: 'between', label: t('search.between') },
      ],
      contract_date: [
        { value: 'active_in', label: t('search.activeInPeriod') },
        { value: 'started_in', label: t('search.startedInPeriod') },
        { value: 'ended_in', label: t('search.endedInPeriod') },
      ],
      diploma: [
        { value: 'has', label: t('search.has') },
        { value: 'not_has', label: t('search.doesNotHave') },
        { value: 'contains', label: t('search.contains') },
      ],
      diploma_issuer: [
        { value: 'is', label: t('search.is') },
        { value: 'contains', label: t('search.contains') },
        { value: 'in', label: t('search.isOneOf') },
      ],
    }
    
    return operatorMap[field] || []
  }

  // Load filter options
  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/employees/filter-options-v2')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions(data)
      }
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  const addQuery = () => {
    const newQuery: QueryCondition = {
      id: Date.now().toString(),
      field: 'name',
      operator: 'contains',
      value: '',
      logicalOperator: 'AND',
    }
    setQueries([...queries, newQuery])
  }

  const removeQuery = (id: string) => {
    if (queries.length > 1) {
      setQueries(queries.filter(q => q.id !== id))
    }
  }

  const updateQuery = (id: string, updates: Partial<QueryCondition>) => {
    setQueries(queries.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const handleSearch = async () => {
    setLoading(true)
    setShowResults(true)
    
    try {
      const response = await fetch('/api/employees/advanced-search-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      })
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.employees || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSearch = () => {
    const name = prompt(t('search.enterSearchName'))
    if (name) {
      const newSavedSearch = {
        id: Date.now().toString(),
        name,
        queries: [...queries]
      }
      setSavedSearches([...savedSearches, newSavedSearch])
      // In a real app, you'd save this to the backend
    }
  }

  const loadSavedSearch = (search: typeof savedSearches[0]) => {
    setQueries([...search.queries])
  }

  const deleteSavedSearch = (searchId: string) => {
    setSavedSearches(savedSearches.filter(search => search.id !== searchId))
  }

  const renderQueryValue = (query: QueryCondition) => {
    const field = query.field
    const operator = query.operator

    // Multi-select fields
    if (['in', 'has_any', 'has_all'].includes(operator)) {
      const options = getOptionsForField(field)
      return (
        <Select
          value={(query.value as string[]).join(',')}
          onValueChange={(value) => updateQuery(query.id, { value: value.split(',') })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t('search.selectMultiple')} />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Single select fields
    if (['is', 'is_not'].includes(operator) && ['department', 'company', 'location', 'beneficiary', 'contract_type', 'skill_level'].includes(field)) {
      const options = getOptionsForField(field)
      return (
        <Select
          value={query.value as string}
          onValueChange={(value) => updateQuery(query.id, { value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t('search.select')} />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Number range fields
    if (operator === 'between') {
      const [min, max] = (query.value as string).split('-')
      return (
        <div className="flex gap-2 flex-1">
          <Input
            type="number"
            placeholder={t('search.min')}
            value={min || ''}
            onChange={(e) => {
              const newMax = max || ''
              updateQuery(query.id, { value: `${e.target.value}-${newMax}` })
            }}
            className="w-24"
          />
          <span className="self-center">{t('search.to')}</span>
          <Input
            type="number"
            placeholder={t('search.max')}
            value={max || ''}
            onChange={(e) => {
              const newMin = min || ''
              updateQuery(query.id, { value: `${newMin}-${e.target.value}` })
            }}
            className="w-24"
          />
        </div>
      )
    }

    // Date range fields
    if (field === 'contract_date') {
      const [start, end] = (query.value as string).split('-')
      return (
        <div className="flex gap-2 flex-1">
          <Input
            type="date"
            value={start || ''}
            onChange={(e) => {
              const newEnd = end || ''
              updateQuery(query.id, { value: `${e.target.value}-${newEnd}` })
            }}
          />
          <span className="self-center">{t('search.to')}</span>
          <Input
            type="date"
            value={end || ''}
            onChange={(e) => {
              const newStart = start || ''
              updateQuery(query.id, { value: `${newStart}-${e.target.value}` })
            }}
          />
        </div>
      )
    }

    // Boolean fields
    if (['has', 'no'].includes(operator)) {
      return null // No value input needed
    }

    // Default text/number input
    return (
      <Input
        type={['contracts_count', 'experience_years', 'count'].includes(field) ? 'number' : 'text'}
        placeholder={getPlaceholderForField(field)}
        value={query.value as string}
        onChange={(e) => updateQuery(query.id, { value: e.target.value })}
        className="flex-1"
      />
    )
  }

  const getOptionsForField = (field: string): string[] => {
    switch (field) {
      case 'department': return filterOptions.departments
      case 'company': return filterOptions.companies
      case 'position': return filterOptions.positions
      case 'location': return filterOptions.locations
      case 'beneficiary': return filterOptions.beneficiaries
      case 'contract_type': return filterOptions.contract_types
      case 'skills': return filterOptions.skill_names
      case 'skill_level': return filterOptions.skill_levels
      case 'diploma': return filterOptions.diploma_names
      case 'diploma_issuer': return filterOptions.diploma_issuers
      default: return []
    }
  }

  const getPlaceholderForField = (field: string): string => {
    switch (field) {
      case 'name': return t('search.enterNameOrEmail')
      case 'skills': return t('search.enterSkills')
      case 'contracts_count': return 'e.g., 5'
      case 'experience_years': return 'e.g., 3'
      case 'diploma': return 'e.g., Computer Science'
      default: return t('search.enterValue')
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('search.queryBuilder')}
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('search.savedSearches')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t('search.advancedQueryBuilder')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveSearch}
                    disabled={queries.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t('search.saveSearch')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={addQuery}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('search.addCondition')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {queries.map((query, index) => (
                <div key={query.id} className="space-y-3">
                  {index > 0 && (
                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" />
                      <Select
                        value={query.logicalOperator}
                        onValueChange={(value: 'AND' | 'OR') => updateQuery(query.id, { logicalOperator: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">{t('search.and')}</SelectItem>
                          <SelectItem value="OR">{t('search.or')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      {/* Field Selection */}
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">{t('search.field')}</Label>
                        <Select
                          value={query.field}
                          onValueChange={(value) => {
                            const operators = getOperatorOptions(value)
                            updateQuery(query.id, { 
                              field: value, 
                              operator: operators[0]?.value || 'contains',
                              value: ''
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldOptions().map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                <div className="flex items-center gap-2">
                                  <field.icon className="h-3 w-3" />
                                  {field.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator Selection */}
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">{t('search.operator')}</Label>
                        <Select
                          value={query.operator}
                          onValueChange={(value) => updateQuery(query.id, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getOperatorOptions(query.field).map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Input */}
                      <div className="col-span-6 space-y-1">
                        <Label className="text-xs">{t('search.value')}</Label>
                        {renderQueryValue(query)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuery(query.id)}
                      disabled={queries.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Search Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSearch} disabled={loading} className="min-w-[200px]">
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? t('search.searching') : t('search.search')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('search.savedSearches')}</CardTitle>
            </CardHeader>
            <CardContent>
              {savedSearches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('search.noSavedSearches')}
                </p>
              ) : (
                <div className="space-y-2">
                  {savedSearches.map(search => (
                    <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{search.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {search.queries.length} {t('search.conditions')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            loadSavedSearch(search)
                            setActiveTab('builder')
                          }}
                        >
                          {t('search.load')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedSearch(search.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      {showResults && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[250px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t('search.noResults')}</p>
                <p className="text-muted-foreground mt-2">{t('search.tryAdjustingQuery')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('search.foundEmployees').replace('{{count}}', results.length.toString())}
                </p>
                <Badge variant="secondary">
                  {queries.filter(q => q.value).length} {t('search.activeConditions')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={employee.profile_image_url || undefined} />
                          <AvatarFallback>
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            {employee.expertise && (
                              <p className="text-sm text-muted-foreground">{employee.expertise}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {employee.email}
                              </div>
                            )}
                            {(employee.company || employee.department) && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building className="h-3 w-3" />
                                {[employee.department, employee.company].filter(Boolean).join(' @ ')}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {employee.contracts_count} {t('search.contracts')}
                              </span>
                              {employee.active_contracts_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {employee.active_contracts_count} {t('search.active')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {employee.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {employee.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill.id} variant="secondary" className="text-xs">
                                  {skill.name} 
                                  {skill.level !== 'Intermediate' && (
                                    <span className="ml-1 opacity-70">({skill.level})</span>
                                  )}
                                </Badge>
                              ))}
                              {employee.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{employee.skills.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/profile/${employee.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {t('search.viewProfile')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}