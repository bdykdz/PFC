'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  Search,
  MoreVertical,
  Eye,
  Shield,
  UserCheck,
  UserX,
  Key,
  Users,
  Activity,
  AlertCircle,
  UserPlus,
  Upload,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface User {
  id: string
  name: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  status: 'active' | 'inactive'
  last_login?: string
  created_at: string
}

interface AzureADUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}

export default function UsersClient() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    editors: 0,
    viewers: 0
  })
  
  // Azure AD Import states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [azureSearchTerm, setAzureSearchTerm] = useState('')
  const [azureUsers, setAzureUsers] = useState<AzureADUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, roleFilter, statusFilter]) // Remove t and toast from dependencies

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, roleFilter, statusFilter]) // Use the actual dependencies directly

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast({
        title: t('common.success'),
        description: t(newStatus === 'active' ? 'admin.userEnabled' : 'admin.userDisabled')
      })
      
      fetchUsers()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to update user status',
        variant: 'destructive'
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update role')

      toast({
        title: t('common.success'),
        description: t('admin.roleChanged')
      })
      
      fetchUsers()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to update user role',
        variant: 'destructive'
      })
    }
  }

  const handlePasswordReset = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to reset password')

      toast({
        title: t('common.success'),
        description: t('admin.passwordResetSent')
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to send password reset',
        variant: 'destructive'
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />
      case 'editor':
        return <UserCheck className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  const searchAzureADUsers = async () => {
    if (!azureSearchTerm.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/azure-ad/search?q=${encodeURIComponent(azureSearchTerm)}`)
      if (!response.ok) throw new Error('Failed to search Azure AD')
      
      const data = await response.json()
      setAzureUsers(data.users || [])
    } catch (error) {
      console.error('Error searching Azure AD:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to search Azure AD users',
        variant: 'destructive'
      })
    } finally {
      setSearching(false)
    }
  }

  const handleImportUsers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: t('common.error'),
        description: t('admin.noUsersSelected'),
        variant: 'destructive'
      })
      return
    }

    setImportLoading(true)
    try {
      const usersToImport = azureUsers.filter(u => selectedUsers.includes(u.id))
      const response = await fetch('/api/admin/azure-ad/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersToImport })
      })

      if (!response.ok) throw new Error('Failed to import users')
      
      const result = await response.json()
      toast({
        title: t('common.success'),
        description: t('admin.usersImported')
      })
      
      setShowImportDialog(false)
      setSelectedUsers([])
      setAzureUsers([])
      setAzureSearchTerm('')
      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error('Error importing users:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to import users',
        variant: 'destructive'
      })
    } finally {
      setImportLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === azureUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(azureUsers.map(u => u.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.totalUsers')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.activeUsers')}</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.admin')}s</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.editor')}s</p>
                <p className="text-2xl font-bold">{stats.editors}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('admin.usersManagement')}</CardTitle>
          <Button onClick={() => setShowImportDialog(true)} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            {t('admin.importFromAD')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('admin.allRoles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allRoles')}</SelectItem>
                <SelectItem value="viewer">{t('admin.viewer')}</SelectItem>
                <SelectItem value="editor">{t('admin.editor')}</SelectItem>
                <SelectItem value="admin">{t('admin.admin')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('admin.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('admin.active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.name')}</TableHead>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.lastLogin')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-3 w-3" />
                                  {t('admin.viewer')}
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-3 w-3" />
                                  {t('admin.editor')}
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  {t('admin.admin')}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? t('admin.active') : t('admin.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_login ? format(new Date(user.last_login), 'MMM dd, yyyy HH:mm') : '-'}
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
                              onClick={() => handleStatusChange(
                                user.id, 
                                user.status === 'active' ? 'inactive' : 'active'
                              )}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  {t('admin.disable')}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  {t('admin.enable')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePasswordReset(user.id, user.email)}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              {t('admin.resetPassword')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/admin/users/${user.id}/activity`}
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              {t('admin.viewActivity')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Role Descriptions */}
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 mt-0.5" />
              <div>
                <span className="font-medium">{t('admin.viewer')}:</span> {t('admin.viewerRole')}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UserCheck className="h-4 w-4 mt-0.5" />
              <div>
                <span className="font-medium">{t('admin.editor')}:</span> {t('admin.editorRole')}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5" />
              <div>
                <span className="font-medium">{t('admin.admin')}:</span> {t('admin.adminRole')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import from Azure AD Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.importFromAD')}</DialogTitle>
            <DialogDescription>
              {t('admin.searchPlaceholder')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={azureSearchTerm}
                onChange={(e) => setAzureSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAzureADUsers()}
              />
              <Button 
                onClick={searchAzureADUsers} 
                disabled={searching || !azureSearchTerm.trim()}
              >
                {searching ? t('admin.searchingAzureAD') : t('admin.search')}
              </Button>
            </div>

            {/* Results */}
            {azureUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    {t('admin.foundUsers')} ({azureUsers.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedUsers.length === azureUsers.length ? 
                      t('common.cancel') : t('admin.selectAll')}
                  </Button>
                </div>
                
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  {azureUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.mail || user.userPrincipalName}
                        </div>
                        {user.jobTitle && (
                          <div className="text-xs text-muted-foreground">
                            {user.jobTitle} {user.department && `- ${user.department}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searching && (
              <div className="text-center py-8">
                <Skeleton className="h-4 w-[200px] mx-auto mb-2" />
                <Skeleton className="h-4 w-[150px] mx-auto" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setSelectedUsers([])
                setAzureUsers([])
                setAzureSearchTerm('')
              }}
            >
              {t('admin.cancel')}
            </Button>
            <Button
              onClick={handleImportUsers}
              disabled={selectedUsers.length === 0 || importLoading}
            >
              {importLoading ? t('admin.importing') : t('admin.importSelected')} 
              {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}