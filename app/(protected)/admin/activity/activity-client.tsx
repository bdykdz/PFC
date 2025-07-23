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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Activity, User, FileText, Shield, Key, LogIn, LogOut } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface ActivityLog {
  id: string
  action: string
  resource_type: string
  resource_id?: string
  user?: {
    name: string
    email: string
  }
  created_at: string
  changes?: any
}

const getActionIcon = (action: string) => {
  if (action.includes('login')) return <LogIn className="h-4 w-4" />
  if (action.includes('logout')) return <LogOut className="h-4 w-4" />
  if (action.includes('user')) return <User className="h-4 w-4" />
  if (action.includes('employee')) return <FileText className="h-4 w-4" />
  if (action.includes('role')) return <Shield className="h-4 w-4" />
  if (action.includes('password')) return <Key className="h-4 w-4" />
  return <Activity className="h-4 w-4" />
}

const getActionColor = (action: string) => {
  if (action.includes('delete')) return 'destructive'
  if (action.includes('create')) return 'default'
  if (action.includes('update') || action.includes('edit')) return 'secondary'
  if (action.includes('login')) return 'outline'
  return 'secondary'
}

const formatAction = (action: string) => {
  return action
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ActivityClient() {
  const { t } = useI18n()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activities')
      
      const data = await response.json()
      setActivities(data.activities)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, page])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('admin.activityLog')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by user or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Activity Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.when')}</TableHead>
                  <TableHead>{t('admin.who')}</TableHead>
                  <TableHead>{t('admin.what')}</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    </TableRow>
                  ))
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {t('admin.noActivityFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-sm">
                        <div>
                          {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.user ? (
                          <div>
                            <div className="font-medium">{activity.user.name}</div>
                            <div className="text-sm text-muted-foreground">{activity.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getActionColor(activity.action)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getActionIcon(activity.action)}
                          {formatAction(activity.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {activity.changes && (
                          <div className="text-muted-foreground">
                            {activity.action === 'user.role_changed' && (
                              <span>
                                {activity.changes.from} → {activity.changes.to}
                              </span>
                            )}
                            {activity.action === 'user.status_changed' && (
                              <span>
                                Status: {activity.changes.status}
                              </span>
                            )}
                            {activity.resource_type === 'employee' && activity.resource_id && (
                              <span>
                                ID: {activity.resource_id}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}