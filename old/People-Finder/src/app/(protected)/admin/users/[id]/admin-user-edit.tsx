'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'
import { validateUserData } from '@/lib/validation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

interface UserFormData {
  name: string
  email: string
  phone: string
  contractType: 'CIM' | 'PFA' | 'SRL'
  company: string
  department: string
  expertise: string
  generalExperience: string
  observations: string
  role: 'admin' | 'user'
}

interface AdminUserEditProps {
  userId: string
  isNewUser: boolean
}

export default function AdminUserEdit({ userId, isNewUser }: AdminUserEditProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    contractType: 'CIM',
    company: '',
    department: '',
    expertise: '',
    generalExperience: '',
    observations: '',
    role: 'user'
  })

  useEffect(() => {
    if (!isNewUser) {
      fetchUser()
    }
  }, [userId, isNewUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUser = async () => {
    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', userId))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          contractType: userData.contractType || 'CIM',
          company: userData.company || '',
          department: userData.department || '',
          expertise: userData.expertise || '',
          generalExperience: userData.generalExperience?.toDate ? 
            userData.generalExperience.toDate().toISOString().split('T')[0] : '',
          observations: userData.observations || '',
          role: userData.role || 'user'
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Validate user data
      const validation = validateUserData({
        ...formData,
        generalExperience: formData.generalExperience ? 
          Timestamp.fromDate(new Date(formData.generalExperience)) : 
          Timestamp.now()
      })

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0]
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive"
        })
        return
      }

      const userData = {
        ...validation.sanitizedData,
        role: formData.role,
        updatedAt: Timestamp.now()
      }

      if (isNewUser) {
        // Create new user
        await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: Timestamp.now()
        })
        
        toast({
          title: "Success",
          description: "User created successfully",
        })
      } else {
        // Update existing user
        await updateDoc(doc(db, 'users', userId), userData)
        
        toast({
          title: "Success",
          description: "User updated successfully",
        })
      }

      router.push('/admin/users')
    } catch (error) {
      console.error('Error saving user:', error)
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewUser ? 'Create New User' : 'Edit User'}
            </h1>
            <p className="text-muted-foreground">
              {isNewUser ? 'Add a new user to the system' : `Editing: ${formData.name || 'User'}`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'user') => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value: 'CIM' | 'PFA' | 'SRL') => 
                    setFormData({ ...formData, contractType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIM">CIM</SelectItem>
                    <SelectItem value="PFA">PFA</SelectItem>
                    <SelectItem value="SRL">SRL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="expertise">Expertise</Label>
                <Input
                  id="expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="generalExperience">General Experience Start Date</Label>
                <Input
                  id="generalExperience"
                  type="date"
                  value={formData.generalExperience}
                  onChange={(e) => setFormData({ ...formData, generalExperience: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/users">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : (isNewUser ? 'Create User' : 'Save Changes')}
          </Button>
        </div>
      </form>
    </div>
  )
}