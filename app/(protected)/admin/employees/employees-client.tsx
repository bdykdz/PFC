'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Users,
  Search,
  Trash2,
  Eye,
  Phone,
  Mail,
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  department: string | null
  general_experience: Date | null
  expertise: string | null
  _count: {
    contracts: number
    skills: number
    diplomas: number
    documents: number
  }
}

export function EmployeesClient() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    // Filter employees based on search term
    if (!searchTerm) {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredEmployees(filtered)
    }
  }, [searchTerm, employees])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
        setFilteredEmployees(data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to load employees',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee)
    setShowDeleteDialog(true)
    setConfirmName('')
  }

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee || confirmName !== deletingEmployee.name) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/employees/${deletingEmployee.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('admin.employeeDeleted')
        })
        setShowDeleteDialog(false)
        setDeletingEmployee(null)
        setConfirmName('')
        loadEmployees() // Reload the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to delete employee',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const getTotalDataCount = (employee: Employee) => {
    return employee._count.contracts + employee._count.skills + employee._count.diplomas + employee._count.documents
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          {t('admin.manageEmployees')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('admin.manageEmployeesDescription')}
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('common.search')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={t('search.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t('admin.users')} 
              <Badge variant="secondary" className="ml-2">
                {filteredEmployees.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? t('search.noResults') : t('search.noEmployeesFound')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {employee.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      {employee.company && (
                        <span><strong>{t('profile.company')}:</strong> {employee.company}</span>
                      )}
                      {employee.department && (
                        <span><strong>{t('profile.department')}:</strong> {employee.department}</span>
                      )}
                      {employee.general_experience && (
                        <span><strong>{t('profile.experience')}:</strong> {new Date().getFullYear() - new Date(employee.general_experience).getFullYear()} {t('profile.years')}</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">
                        {employee._count.contracts} {t('profile.contracts')}
                      </Badge>
                      <Badge variant="outline">
                        {employee._count.skills} {t('profile.skills')}
                      </Badge>
                      <Badge variant="outline">
                        {employee._count.diplomas} {t('profile.diplomas')}
                      </Badge>
                      <Badge variant="outline">
                        {employee._count.documents} {t('profile.documents')}
                      </Badge>
                      <Badge variant="secondary">
                        {getTotalDataCount(employee)} total items
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/employee/${employee.id}`, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('search.viewProfile')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(employee)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('admin.deleteEmployee')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <DialogTitle>{t('admin.deleteEmployee')}</DialogTitle>
            </div>
            <DialogDescription>
              {t('admin.confirmDeleteEmployee')}
            </DialogDescription>
          </DialogHeader>

          {deletingEmployee && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{t('admin.dangerZone')}</span>
                </div>
                <p className="text-sm text-red-700">
                  {t('admin.thisActionCannotBeUndone')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium">{deletingEmployee.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {deletingEmployee._count.contracts} contracts
                    </Badge>
                    <Badge variant="outline">
                      {deletingEmployee._count.skills} skills
                    </Badge>
                    <Badge variant="outline">
                      {deletingEmployee._count.diplomas} diplomas
                    </Badge>
                    <Badge variant="outline">
                      {deletingEmployee._count.documents} documents
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.typeEmployeeName')}
                  </label>
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={deletingEmployee.name}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEmployee}
              disabled={!deletingEmployee || confirmName !== deletingEmployee.name || deleting}
            >
              {deleting ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}