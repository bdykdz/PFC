'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import {
  User,
  Mail,
  Shield,
  Clock,
  Activity,
  Settings,
  Save,
  Calendar,
  Users,
  FileText,
  Building,
  MapPin,
} from 'lucide-react'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  updated_at: string
  // Optional employee data if user is linked to an employee
  employee?: {
    id: string
    name: string
    phone: string | null
    company: string | null
    department: string | null
    expertise: string | null
    _count: {
      contracts: number
      skills: number
      diplomas: number
      documents: number
    }
  }
  // Activity stats
  activityStats?: {
    totalActions: number
    recentActions: number
    lastAction: string | null
  }
}

export function ProfileClient() {
  const { data: session } = useSession()
  const { t } = useI18n()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    if (session?.user) {
      loadProfile()
    }
  }, [session])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditedName(data.name)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile || !editedName.trim()) return

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        toast({
          title: t('common.success'),
          description: 'Profile updated successfully'
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = profile.name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          {t('navigation.profile')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Main Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Information
              </CardTitle>
              <Button
                variant={editing ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (editing) {
                    handleSaveProfile()
                  } else {
                    setEditing(true)
                  }
                }}
              >
                {editing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('common.save')}
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.user?.image || undefined} alt={profile.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    {editing ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-lg font-medium">{profile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role:</span>
                    <Badge className={getRoleColor(profile.role)}>
                      {t(`admin.${profile.role}`)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getStatusColor(profile.status)}>
                      {t(`admin.${profile.status}`)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Member since: {format(new Date(profile.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {profile.last_login && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Last login: {format(new Date(profile.last_login), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Profile Link */}
        {profile.employee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{profile.employee.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {profile.employee.company && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {profile.employee.company}
                      </div>
                    )}
                    {profile.employee.department && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.employee.department}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      {profile.employee._count.contracts} {t('profile.contracts')}
                    </Badge>
                    <Badge variant="outline">
                      {profile.employee._count.skills} {t('profile.skills')}
                    </Badge>
                    <Badge variant="outline">
                      {profile.employee._count.diplomas} {t('profile.diplomas')}
                    </Badge>
                    <Badge variant="outline">
                      {profile.employee._count.documents} {t('profile.documents')}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(`/profile/${profile.employee?.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Summary */}
        {profile.activityStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.activityStats.totalActions}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Actions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {profile.activityStats.recentActions}
                  </div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-medium">
                    {profile.activityStats.lastAction 
                      ? format(new Date(profile.activityStats.lastAction), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Last Activity</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}