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
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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
  current_contracts: Array<{
    id: string
    name: string
    position: string | null
    beneficiary: string | null
    location: string | null
  }>
  skills: Array<{
    id: string
    name: string
    level: string
    type: string
  }>
  diplomas_count: number
}

interface FilterOptions {
  departments: string[]
  companies: string[]
  positions: string[]
  locations: string[]
  contract_types: string[]
  skill_names: string[]
}

export default function AdvancedSearch() {
  const router = useRouter()
  const { t } = useI18n()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    companies: [],
    positions: [],
    locations: [],
    contract_types: ['CIM', 'PFA', 'SRL'],
    skill_names: [],
  })
  
  // Search filters
  const [searchName, setSearchName] = useState('')
  const [searchSkills, setSearchSkills] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedContractType, setSelectedContractType] = useState('all')
  const [minContracts, setMinContracts] = useState('')
  const [minExperience, setMinExperience] = useState('')
  
  const [showFilters, setShowFilters] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  // Load filter options
  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/employees/filter-options')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions(data)
      }
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)
    
    const params = new URLSearchParams()
    if (searchName) params.append('name', searchName)
    if (searchSkills) params.append('skills', searchSkills)
    if (selectedDepartment !== 'all') params.append('department', selectedDepartment)
    if (selectedCompany !== 'all') params.append('company', selectedCompany)
    if (selectedPosition !== 'all') params.append('position', selectedPosition)
    if (selectedLocation !== 'all') params.append('location', selectedLocation)
    if (selectedContractType !== 'all') params.append('contractType', selectedContractType)
    if (minContracts) params.append('minContracts', minContracts)
    if (minExperience) params.append('minExperience', minExperience)

    try {
      const response = await fetch(`/api/employees/advanced-search?${params}`)
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

  const clearFilters = () => {
    setSearchName('')
    setSearchSkills('')
    setSelectedDepartment('all')
    setSelectedCompany('all')
    setSelectedPosition('all')
    setSelectedLocation('all')
    setSelectedContractType('all')
    setMinContracts('')
    setMinExperience('')
    setResults([])
    setHasSearched(false)
  }

  const activeFiltersCount = [
    searchName,
    searchSkills,
    selectedDepartment !== 'all',
    selectedCompany !== 'all',
    selectedPosition !== 'all',
    selectedLocation !== 'all',
    selectedContractType !== 'all',
    minContracts,
    minExperience,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('search.searchFilters')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        
        <Collapsible open={showFilters}>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Basic Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('search.nameOrEmail')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="name"
                      placeholder={t('search.nameOrEmailPlaceholder')}
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">{t('search.skills')}</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="skills"
                      placeholder={t('search.skillsPlaceholder')}
                      value={searchSkills}
                      onChange={(e) => setSearchSkills(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Company and Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">{t('search.company')}</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger id="company">
                      <Building className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('search.allCompanies')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.allCompanies')}</SelectItem>
                      {filterOptions.companies.map(company => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">{t('search.department')}</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger id="department">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('search.allDepartments')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.allDepartments')}</SelectItem>
                      {filterOptions.departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Position and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">{t('search.position')}</Label>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger id="position">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('search.allPositions')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.allPositions')}</SelectItem>
                      {filterOptions.positions.map(position => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">{t('search.location')}</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('search.allLocations')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.allLocations')}</SelectItem>
                      {filterOptions.locations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contract Type and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractType">{t('search.contractType')}</Label>
                  <Select value={selectedContractType} onValueChange={setSelectedContractType}>
                    <SelectTrigger id="contractType">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('search.allContractTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.allContractTypes')}</SelectItem>
                      {filterOptions.contract_types.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minContracts">{t('search.minContracts')}</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="minContracts"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minContracts}
                      onChange={(e) => setMinContracts(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minExperience">{t('search.minExperienceYears')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="minExperience"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    {t('search.clearFilters')}
                  </Button>
                )}
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? t('search.searching') : t('search.search')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Search Results */}
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
      ) : hasSearched && results.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('search.noResults')}</p>
            <p className="text-muted-foreground mt-2">{t('search.tryDifferentFilters')}</p>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('search.foundResults').replace('{{count}}', results.length.toString())}
          </p>
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
                        {employee.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        )}
                        {(employee.company || employee.department) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-3 w-3" />
                            {[employee.department, employee.company].filter(Boolean).join(' @ ')}
                          </div>
                        )}
                      </div>

                      {employee.current_contracts.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {t('search.currentContracts')} ({employee.contracts_count})
                          </p>
                          <div className="text-sm text-muted-foreground">
                            {employee.current_contracts.slice(0, 2).map((contract, idx) => (
                              <div key={contract.id}>
                                {contract.position} @ {contract.beneficiary}
                                {contract.location && ` - ${contract.location}`}
                              </div>
                            ))}
                            {employee.current_contracts.length > 2 && (
                              <div className="text-xs">
                                +{employee.current_contracts.length - 2} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {employee.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {employee.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="text-xs">
                              {skill.name}
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
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('search.startSearching')}</p>
            <p className="text-muted-foreground mt-2">{t('search.useFiltersAbove')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}