'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X,
  Star,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react'
import { TenderSearchFilters, DEFAULT_PROJECT_CATEGORIES, SECURITY_CLEARANCE_LEVELS, AVAILABILITY_STATUS } from '@/types/tender'

interface EmployeeFiltersProps {
  filters: TenderSearchFilters
  onFiltersChange: (filters: TenderSearchFilters) => void
}

export function EmployeeFilters({ filters, onFiltersChange }: EmployeeFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof TenderSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
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

  return (
    <div className="space-y-3">
      {/* Filter Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between text-sm"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-3">
          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="w-full text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All Filters
            </Button>
          )}

          {/* Key Expert Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              Expert Level
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keyExpert"
                checked={filters.isKeyExpert === true}
                onCheckedChange={(checked) => 
                  updateFilter('isKeyExpert', checked ? true : undefined)
                }
              />
              <Label htmlFor="keyExpert" className="text-xs">
                Key Experts Only
              </Label>
            </div>
          </div>

          <Separator />

          {/* Availability Status */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Availability
            </Label>
            <div className="space-y-2">
              {AVAILABILITY_STATUS.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`availability-${status}`}
                    checked={filters.availabilityStatus?.includes(status) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.availabilityStatus || []
                      const updated = checked
                        ? [...current, status]
                        : current.filter(s => s !== status)
                      updateFilter('availabilityStatus', updated.length ? updated : undefined)
                    }}
                  />
                  <Label htmlFor={`availability-${status}`} className="text-xs">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Security Clearance */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Security Clearance
            </Label>
            <div className="space-y-2">
              {SECURITY_CLEARANCE_LEVELS.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`clearance-${level}`}
                    checked={filters.securityClearance?.includes(level) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.securityClearance || []
                      const updated = checked
                        ? [...current, level]
                        : current.filter(l => l !== level)
                      updateFilter('securityClearance', updated.length ? updated : undefined)
                    }}
                  />
                  <Label htmlFor={`clearance-${level}`} className="text-xs">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Project Categories */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Project Categories</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {DEFAULT_PROJECT_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.projectCategories?.includes(category) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.projectCategories || []
                      const updated = checked
                        ? [...current, category]
                        : current.filter(c => c !== category)
                      updateFilter('projectCategories', updated.length ? updated : undefined)
                    }}
                  />
                  <Label htmlFor={`category-${category}`} className="text-xs">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Years of Experience</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.yearsExperience?.min || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined
                    updateFilter('yearsExperience', {
                      ...filters.yearsExperience,
                      min: value
                    })
                  }}
                  className="text-xs"
                  min="0"
                  max="50"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.yearsExperience?.max || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined
                    updateFilter('yearsExperience', {
                      ...filters.yearsExperience,
                      max: value
                    })
                  }}
                  className="text-xs"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Hourly Rate (EUR)
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.hourlyRate?.min || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined
                    updateFilter('hourlyRate', {
                      ...filters.hourlyRate,
                      min: value
                    })
                  }}
                  className="text-xs"
                  min="0"
                  step="5"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.hourlyRate?.max || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined
                    updateFilter('hourlyRate', {
                      ...filters.hourlyRate,
                      max: value
                    })
                  }}
                  className="text-xs"
                  min="0"
                  step="5"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="space-y-2">
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
            
            {filters.availabilityStatus?.map((status) => (
              <Badge key={status} variant="secondary" className="text-xs">
                {status}
                <X 
                  className="h-2 w-2 ml-1 cursor-pointer" 
                  onClick={() => {
                    const updated = filters.availabilityStatus?.filter(s => s !== status)
                    updateFilter('availabilityStatus', updated?.length ? updated : undefined)
                  }}
                />
              </Badge>
            ))}
            
            {filters.securityClearance?.map((level) => (
              <Badge key={level} variant="secondary" className="text-xs">
                <Shield className="h-2 w-2 mr-1" />
                {level}
                <X 
                  className="h-2 w-2 ml-1 cursor-pointer" 
                  onClick={() => {
                    const updated = filters.securityClearance?.filter(l => l !== level)
                    updateFilter('securityClearance', updated?.length ? updated : undefined)
                  }}
                />
              </Badge>
            ))}
            
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
                +{(filters.projectCategories?.length || 0) - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}