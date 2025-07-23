'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { useI18n } from '@/lib/i18n/context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Building,
  Briefcase,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  department: string | null
  company: string | null
  expertise: string | null
  profile_image_url: string | null
  contract_type: string | null
  contracts: Array<{
    id: string
    position: string | null
    beneficiary: string | null
  }>
  skills: Array<{
    id: string
    name: string
    level: string
  }>
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export default function EmployeeTable() {
  const router = useRouter()
  const { t } = useI18n()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [departments, setDepartments] = useState<string[]>([])
  const [companies, setCompanies] = useState<string[]>([])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearchTerm,
        department: departmentFilter,
        company: companyFilter,
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/employees/search?${params}`)
      const data = await response.json()

      setEmployees(data.employees)
      setPagination(data.pagination)
      setDepartments(data.filters.departments)
      setCompanies(data.filters.companies)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearchTerm,
    departmentFilter,
    companyFilter,
    sortBy,
    sortOrder,
  ])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearchTerm, departmentFilter, companyFilter])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('')
    setCompanyFilter('')
  }

  const hasActiveFilters = searchTerm || departmentFilter || companyFilter

  return (
    <Card className="p-6">
      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('search.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={departmentFilter || "all"} onValueChange={(value) => setDepartmentFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('search.allDepartments')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.allDepartments')}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyFilter || "all"} onValueChange={(value) => setCompanyFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('search.allCompanies')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.allCompanies')}</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('search.activeFilters')}</span>
            {searchTerm && (
              <Badge variant="secondary">
                {t('search.searchFilter')}: {searchTerm}
              </Badge>
            )}
            {departmentFilter && (
              <Badge variant="secondary">
                {t('search.deptFilter')}: {departmentFilter}
              </Badge>
            )}
            {companyFilter && (
              <Badge variant="secondary">
                {t('search.companyFilter')}: {companyFilter}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              {t('search.clear')}
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium"
                >
                  {t('search.employee')}
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                    <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortBy !== 'name' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead>{t('search.contact')}</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('department')}
                  className="h-auto p-0 font-medium"
                >
                  {t('search.department')}
                  {sortBy === 'department' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                    <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortBy !== 'department' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead>{t('search.position')}</TableHead>
              <TableHead>{t('search.skills')}</TableHead>
              <TableHead className="text-right">{t('search.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {hasActiveFilters ? t('search.noEmployeesMatchingCriteria') : t('search.noEmployeesFound')}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={employee.profile_image_url || undefined} />
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.expertise || t('search.noExpertiseListed')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.department && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {employee.department}
                      </div>
                    )}
                    {employee.company && (
                      <div className="text-sm text-muted-foreground">
                        {employee.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.contracts[0] && (
                      <div className="space-y-1">
                        {employee.contracts[0].position && (
                          <div className="text-sm font-medium">
                            {employee.contracts[0].position}
                          </div>
                        )}
                        {employee.contracts[0].beneficiary && (
                          <div className="text-sm text-muted-foreground">
                            {t('search.at')} {employee.contracts[0].beneficiary}
                          </div>
                        )}
                      </div>
                    )}
                    {employee.contract_type && (
                      <Badge variant="outline" className="mt-1">
                        {employee.contract_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {employee.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                      {employee.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{employee.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/profile/${employee.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('search.viewProfile')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.location.href = `mailto:${employee.email}`}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          {t('search.sendEmail')}
                        </DropdownMenuItem>
                        {employee.phone && (
                          <DropdownMenuItem
                            onClick={() => window.location.href = `tel:${employee.phone}`}
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            {t('search.call')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {t('search.showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('search.to')}{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} {t('search.of')}{' '}
            {pagination.totalCount} {t('search.employees')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('search.previous')}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              {t('search.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}