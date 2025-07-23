'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Users, CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface AzureUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
}

interface ImportUser extends AzureUser {
  selected: boolean
  role: 'viewer' | 'editor' | 'manager' | 'admin'
  contractType?: 'CIM' | 'PFA' | 'SRL'
}

export default function AdminSetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useI18n()
  const [azureUsers, setAzureUsers] = useState<ImportUser[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [importResults, setImportResults] = useState<{
    imported: number
    updated: number
    failed: number
    errors: { email: string; error: string }[]
  } | null>(null)

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/search')
    }
  }, [session, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/azure-users?search=${searchTerm}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setAzureUsers(
        data.users.map((user: AzureUser) => ({
          ...user,
          selected: false,
          role: 'viewer' as const,
          contractType: undefined
        }))
      )
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setAzureUsers(users =>
      users.map(user => ({ ...user, selected: checked }))
    )
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    setAzureUsers(users =>
      users.map(user =>
        user.id === userId ? { ...user, selected: checked } : user
      )
    )
  }

  const handleRoleChange = (userId: string, role: string) => {
    setAzureUsers(users =>
      users.map(user =>
        user.id === userId ? { ...user, role: role as ImportUser['role'] } : user
      )
    )
  }

  const handleContractTypeChange = (userId: string, contractType: string) => {
    setAzureUsers(users =>
      users.map(user =>
        user.id === userId 
          ? { ...user, contractType: contractType as ImportUser['contractType'] } 
          : user
      )
    )
  }

  const handleImport = async () => {
    const selectedUsers = azureUsers.filter(user => user.selected)
    if (selectedUsers.length === 0) return

    setImporting(true)
    setImportResults(null)

    try {
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: selectedUsers.map(user => ({
            azureId: user.id,
            email: user.mail || user.userPrincipalName,
            name: user.displayName,
            jobTitle: user.jobTitle,
            department: user.department,
            role: user.role,
            contractType: user.contractType
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to import users')
      
      const data = await response.json()
      setImportResults(data.results)
      
      // Clear selected users after successful import
      setAzureUsers(users =>
        users.filter(user => !user.selected)
      )
    } catch (error) {
      console.error('Error importing users:', error)
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = azureUsers.filter(u => u.selected).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.importTitle')}</CardTitle>
          <CardDescription>
            {t('admin.importDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              />
            </div>
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {t('admin.search')}
            </Button>
          </div>

          {importResults && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t('admin.importComplete')}: {importResults.imported} {t('admin.newUsers')}, {importResults.updated} {t('admin.updated')}, {importResults.failed} {t('admin.failed')}
                {importResults.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {t('admin.errors')}: {importResults.errors.map(e => `${e.email}: ${e.error}`).join(', ')}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {azureUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('admin.foundUsers')} ({azureUsers.length})</span>
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2">
                  <Checkbox
                    checked={azureUsers.every(u => u.selected)}
                    onCheckedChange={handleSelectAll}
                  />
                  {t('admin.selectAll')}
                </Label>
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  {t('admin.import')} {selectedCount} {selectedCount !== 1 ? t('admin.users') : t('admin.user')}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {azureUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <Checkbox
                    checked={user.selected}
                    onCheckedChange={(checked) =>
                      handleSelectUser(user.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-600">
                      {user.mail || user.userPrincipalName}
                    </div>
                    {user.jobTitle && (
                      <div className="text-sm text-gray-500">{user.jobTitle}</div>
                    )}
                    {user.department && (
                      <div className="text-sm text-gray-500">{user.department}</div>
                    )}
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={!user.selected}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">{t('admin.viewer')}</SelectItem>
                      <SelectItem value="editor">{t('admin.editor')}</SelectItem>
                      <SelectItem value="manager">{t('admin.manager')}</SelectItem>
                      <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={user.contractType || 'none'}
                    onValueChange={(value) =>
                      handleContractTypeChange(user.id, value === 'none' ? '' : value)
                    }
                    disabled={!user.selected}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={t('admin.contract')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('admin.noContract')}</SelectItem>
                      <SelectItem value="CIM">CIM</SelectItem>
                      <SelectItem value="PFA">PFA</SelectItem>
                      <SelectItem value="SRL">SRL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}