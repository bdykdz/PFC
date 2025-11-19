'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X,
  Star,
  Shield,
  Clock,
  DollarSign,
  Zap,
  Users,
  Award,
  Bookmark,
  Save,
  Search
} from 'lucide-react'
import { TenderSearchFilters, DEFAULT_PROJECT_CATEGORIES, SECURITY_CLEARANCE_LEVELS, AVAILABILITY_STATUS } from '@/types/tender'

interface AdvancedEmployeeFiltersProps {
  filters: TenderSearchFilters
  onFiltersChange: (filters: TenderSearchFilters) => void
  employeeCount: number
}

// Predefined quick tags for common search patterns
const QUICK_TAGS = [
  { id: 'water-expert', label: 'Water Expert', icon: '💧', filter: { projectCategories: ['Water & Utilities'] } },
  { id: 'team-lead', label: 'Team Lead', icon: '👥', filter: { isKeyExpert: true, yearsExperience: { min: 8 } } },
  { id: 'senior-dev', label: 'Senior Dev', icon: '💻', filter: { projectCategories: ['IT & Software'], yearsExperience: { min: 5 } } },
  { id: 'project-mgr', label: 'Project Mgr', icon: '📋', filter: { isKeyExpert: true, projectCategories: ['Infrastructure', 'Construction'] } },
  { id: 'security-cleared', label: 'High Clearance', icon: '🔒', filter: { securityClearance: ['Secret', 'Top Secret'] } },
  { id: 'available-now', label: 'Available Now', icon: '✅', filter: { availabilityStatus: ['Available'] } },
  { id: 'cost-effective', label: 'Cost Effective', icon: '💰', filter: { hourlyRate: { max: 50 } } },
  { id: 'experienced', label: '10+ Years', icon: '🎯', filter: { yearsExperience: { min: 10 } } }
]

export function AdvancedEmployeeFilters({ filters, onFiltersChange, employeeCount }: AdvancedEmployeeFiltersProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [savedSearches, setSavedSearches] = useState<Array<{id: string, name: string, filters: TenderSearchFilters}>>([])
  const [saveSearchName, setSaveSearchName] = useState('')

  const updateFilter = (key: keyof TenderSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const mergeFilters = (newFilters: Partial<TenderSearchFilters>) => {
    onFiltersChange({
      ...filters,
      ...newFilters
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const applyQuickTag = (tagFilter: Partial<TenderSearchFilters>) => {
    mergeFilters(tagFilter)
  }

  const saveCurrentSearch = () => {
    if (saveSearchName.trim()) {
      const newSearch = {
        id: Date.now().toString(),
        name: saveSearchName.trim(),
        filters: { ...filters }
      }
      setSavedSearches(prev => [...prev, newSearch])
      setSaveSearchName('')
    }
  }

  const loadSavedSearch = (searchFilters: TenderSearchFilters) => {
    onFiltersChange(searchFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.projectCategories?.length) count++
    if (filters.securityClearance?.length) count++
    if (filters.availabilityStatus?.length) count++
    if (filters.isKeyExpert !== undefined) count++
    if (filters.yearsExperience?.min !== undefined || filters.yearsExperience?.max !== undefined) count++
    if (filters.hourlyRate?.min !== undefined || filters.hourlyRate?.max !== undefined) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()
  const experienceRange = [filters.yearsExperience?.min || 0, filters.yearsExperience?.max || 30]
  const rateRange = [filters.hourlyRate?.min || 20, filters.hourlyRate?.max || 150]

  return (
    <div className="space-y-4">
      {/* Quick Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_TAGS.map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                onClick={() => applyQuickTag(tag.filter)}
                className="justify-start text-xs h-8"
              >
                <span className="mr-1">{tag.icon}</span>
                {tag.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </CardTitle>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Clear All Button */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All Filters ({employeeCount} found)
                </Button>
              )}

              {/* Experience Range Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Experience Range
                </Label>
                <div className="px-2">
                  <Slider
                    value={experienceRange}
                    onValueChange={([min, max]) => {
                      updateFilter('yearsExperience', { min: min === 0 ? undefined : min, max: max === 30 ? undefined : max })
                    }}
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{experienceRange[0]} years</span>
                    <span>{experienceRange[1] === 30 ? '30+' : experienceRange[1]} years</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Hourly Rate Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate Range
                </Label>
                <div className="px-2">
                  <Slider
                    value={rateRange}
                    onValueChange={([min, max]) => {
                      updateFilter('hourlyRate', { min: min === 20 ? undefined : min, max: max === 150 ? undefined : max })
                    }}
                    min={20}
                    max={150}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>€{rateRange[0]}/h</span>
                    <span>€{rateRange[1] === 150 ? '150+' : rateRange[1]}/h</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Multi-Select Project Categories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Project Categories</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select categories..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground mb-2">Select multiple categories:</div>
                      {DEFAULT_PROJECT_CATEGORIES.map((category) => (
                        <div key={category} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id={`cat-${category}`}
                            checked={filters.projectCategories?.includes(category) || false}
                            onChange={(e) => {
                              const current = filters.projectCategories || []
                              const updated = e.target.checked
                                ? [...current, category]
                                : current.filter(c => c !== category)
                              updateFilter('projectCategories', updated.length ? updated : undefined)
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`cat-${category}`} className="text-xs cursor-pointer">
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-Select Security Clearance */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Clearance
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {SECURITY_CLEARANCE_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={filters.securityClearance?.includes(level) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = filters.securityClearance || []
                        const updated = current.includes(level)
                          ? current.filter(l => l !== level)
                          : [...current, level]
                        updateFilter('securityClearance', updated.length ? updated : undefined)
                      }}
                      className="text-xs h-7"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Availability Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Availability
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_STATUS.map((status) => (
                    <Button
                      key={status}
                      variant={filters.availabilityStatus?.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = filters.availabilityStatus || []
                        const updated = current.includes(status)
                          ? current.filter(s => s !== status)
                          : [...current, status]
                        updateFilter('availabilityStatus', updated.length ? updated : undefined)
                      }}
                      className="text-xs h-7"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Key Expert Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Key Experts Only
                </Label>
                <Button
                  variant={filters.isKeyExpert ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('isKeyExpert', filters.isKeyExpert ? undefined : true)}
                  className="text-xs h-7"
                >
                  {filters.isKeyExpert ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Saved Searches */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Searches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Save Current Search */}
          {activeFilterCount > 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Search name..."
                className="flex-1 px-2 py-1 text-xs border rounded"
              />
              <Button
                size="sm"
                onClick={saveCurrentSearch}
                disabled={!saveSearchName.trim()}
                className="text-xs h-7"
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Saved Search List */}
          <div className="space-y-1">
            {savedSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-xs font-medium">{search.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadSavedSearch(search.filters)}
                    className="h-6 w-6 p-0"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSavedSearches(prev => prev.filter(s => s.id !== search.id))}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Filters ({employeeCount} results)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {filters.isKeyExpert && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-2 w-2 mr-1" />
                  Key Expert
                  <X 
                    className="h-2 w-2 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('isKeyExpert', undefined)}
                  />
                </Badge>
              )}
              
              {filters.projectCategories?.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <X 
                    className="h-2 w-2 ml-1 cursor-pointer" 
                    onClick={() => {
                      const updated = filters.projectCategories?.filter(c => c !== category)
                      updateFilter('projectCategories', updated?.length ? updated : undefined)
                    }}
                  />
                </Badge>
              ))}
              
              {(filters.projectCategories?.length || 0) > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{(filters.projectCategories?.length || 0) - 2} more categories
                </Badge>
              )}

              {filters.yearsExperience && (
                <Badge variant="secondary" className="text-xs">
                  {filters.yearsExperience.min || 0}-{filters.yearsExperience.max || '30+'} years
                  <X 
                    className="h-2 w-2 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('yearsExperience', undefined)}
                  />
                </Badge>
              )}

              {filters.hourlyRate && (
                <Badge variant="secondary" className="text-xs">
                  €{filters.hourlyRate.min || 20}-{filters.hourlyRate.max || '150+'}/h
                  <X 
                    className="h-2 w-2 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('hourlyRate', undefined)}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}