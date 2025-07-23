'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  jobTitle?: string
  department?: string
}

export default function AdminSelectionPage() {
  const router = useRouter()
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [adminUserId, setAdminUserId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [totalAzureUsers, setTotalAzureUsers] = useState<number>(0)

  useEffect(() => {
    // Get selected users from sessionStorage
    const storedUsers = sessionStorage.getItem('selectedUsers')
    console.log('Stored users from sessionStorage:', storedUsers)
    
    if (!storedUsers) {
      toast.error('No users selected. Please go back and select users.')
      router.push('/setup')
      return
    }

    try {
      const users = JSON.parse(storedUsers)
      console.log('Parsed users:', users)
      setSelectedUsers(users)
      // Pre-select first user as admin
      if (users.length > 0) {
        console.log('Pre-selecting admin user:', users[0].id)
        setAdminUserId(users[0].id)
      }
      
      // Get total Azure users count
      const allUsersStr = sessionStorage.getItem('allAzureUsers')
      if (allUsersStr) {
        const allUsers = JSON.parse(allUsersStr)
        setTotalAzureUsers(allUsers.length)
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      toast.error('Invalid user data. Please go back and try again.')
      router.push('/setup')
    }
  }, [router])

  const importUsers = async () => {
    console.log('Import users called')
    console.log('adminUserId:', adminUserId)
    console.log('selectedUsers:', selectedUsers)
    
    if (!adminUserId) {
      toast.error('Please select an admin user from the selected users')
      return
    }

    // Get all Azure users from session storage
    const allAzureUsersStr = sessionStorage.getItem('allAzureUsers')
    if (!allAzureUsersStr) {
      toast.error('Azure users data not found. Please go back and try again.')
      router.push('/setup')
      return
    }

    setIsImporting(true)
    try {
      const allAzureUsers = JSON.parse(allAzureUsersStr)
      const selectedUserIds = selectedUsers.map(u => u.id)
      
      const response = await fetch('/api/setup/import-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allAzureUsers,
          selectedUserIds,
          adminUserId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to import users')
      }
      
      const data = await response.json()
      toast.success(`Successfully created ${data.employeesCreated} employee profiles and ${data.usersCreated} user accounts`)
      
      // Clear session storage
      sessionStorage.removeItem('selectedUsers')
      sessionStorage.removeItem('allAzureUsers')
      
      // Redirect to app
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      toast.error('Failed to import users')
      console.error('Error importing users:', error)
    } finally {
      setIsImporting(false)
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Select Administrator</h1>
          <p className="text-muted-foreground mt-2">
            Choose which user should have full administrative privileges
          </p>
        </div>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Users</span>
            </div>
            <div className="w-16 h-[2px] bg-primary" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Choose Admin</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administrator Selection</CardTitle>
              <CardDescription>
                Select one user from the {selectedUsers.length} selected users to be the administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={adminUserId} onValueChange={setAdminUserId}>
                <div className="space-y-4">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setAdminUserId(user.id)}
                    >
                      <RadioGroupItem value={user.id} id={`admin-${user.id}`} />
                      <Label
                        htmlFor={`admin-${user.id}`}
                        className="flex-1 cursor-pointer flex items-center space-x-3"
                      >
                        <Avatar>
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.jobTitle && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {user.jobTitle} {user.department && `• ${user.department}`}
                            </div>
                          )}
                        </div>
                        {adminUserId === user.id && (
                          <Badge variant="default">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Import Summary</CardTitle>
              <CardDescription>
                Review your selection before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Azure users fetched:</span>
                <span className="font-semibold">{totalAzureUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Users with login access:</span>
                <span className="font-semibold">{selectedUsers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Administrator:</span>
                <span className="font-semibold">
                  {selectedUsers.find(u => u.id === adminUserId)?.name || 'None selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Regular users (can login):</span>
                <span className="font-semibold">{selectedUsers.length - 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employee profiles only:</span>
                <span className="font-semibold">{totalAzureUsers - selectedUsers.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/setup')}
              disabled={isImporting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to User Selection
            </Button>
            <Button
              onClick={importUsers}
              disabled={isImporting || !adminUserId}
              size="lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing users...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Setup & Import Users
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}