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

export default function AdminSelectionClient() {
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
      console.error('No users in sessionStorage')
      toast.error('No users selected. Please go back and select users.')
      setTimeout(() => {
        router.push('/setup')
      }, 100)
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
      const allUsers = sessionStorage.getItem('allAzureUsers')
      if (allUsers) {
        const parsedAllUsers = JSON.parse(allUsers)
        setTotalAzureUsers(parsedAllUsers.length)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error loading selected users')
      router.push('/setup')
    }
  }, [router])

  const handleImport = async () => {
    if (!adminUserId) {
      toast.error('Please select an administrator')
      return
    }

    setIsImporting(true)

    try {
      // Get all Azure users from sessionStorage
      const allUsersStr = sessionStorage.getItem('allAzureUsers')
      if (!allUsersStr) {
        throw new Error('Azure users data not found')
      }
      
      const allAzureUsers = JSON.parse(allUsersStr)
      const selectedUserIds = selectedUsers.map(user => user.id)

      console.log('Sending to API:', {
        allAzureUsers: allAzureUsers.length,
        selectedUserIds: selectedUserIds.length,
        adminUserId
      })

      const response = await fetch('/api/setup/import-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allAzureUsers: allAzureUsers,
          selectedUserIds: selectedUserIds,
          adminUserId: adminUserId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import users')
      }

      console.log('Import response:', data)

      // Clear session storage
      sessionStorage.removeItem('selectedUsers')
      sessionStorage.removeItem('allAzureUsers')

      // Show success message
      toast.success('Setup complete! Redirecting to login...')

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Error importing users:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import users')
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
        <Button
          variant="ghost"
          onClick={() => router.push('/setup')}
          className="mb-6"
          disabled={isImporting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Selection
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Select Administrator</h1>
          <p className="text-muted-foreground mt-2">
            Choose which user will be the system administrator
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Administrator Selection</CardTitle>
              <CardDescription>
                The administrator has full control over the system and can manage other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={adminUserId} onValueChange={setAdminUserId}>
                <div className="space-y-4">
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value={user.id} id={user.id} />
                      <Label htmlFor={user.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name}</p>
                              {user.id === adminUserId && (
                                <Badge variant="default" className="text-xs">
                                  <Shield className="mr-1 h-3 w-3" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {(user.jobTitle || user.department) && (
                              <p className="text-sm text-muted-foreground">
                                {[user.jobTitle, user.department].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Users in Azure AD:</span>
                  <span className="font-medium">{totalAzureUsers || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Employee Profiles to Create:</span>
                  <span className="font-medium">{totalAzureUsers || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Users with Login Access:</span>
                  <span className="font-medium text-green-600">{selectedUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Administrator:</span>
                  <span className="font-medium text-blue-600">
                    {selectedUsers.find(u => u.id === adminUserId)?.name || 'Not selected'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Happens Next</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>All Azure AD users become searchable employee profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Selected {selectedUsers.length} users can login to the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Administrator can manage users and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You'll be redirected to login after import</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            onClick={handleImport}
            disabled={!adminUserId || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Users...
              </>
            ) : (
              <>
                Complete Setup
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}