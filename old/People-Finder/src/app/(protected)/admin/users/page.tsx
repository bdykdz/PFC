'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/components/ui/use-toast'
import { Search, Edit, Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  phone: string
  contractType: 'CIM' | 'PFA' | 'SRL'
  company: string
  department: string
  role?: 'admin' | 'user'
  createdAt: Date
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole })
      
      // Log admin action
      try {
        const response = await fetch('/api/admin/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_USER_ROLE',
            targetType: 'user',
            targetId: userId,
            details: { newRole }
          })
        })
      } catch (logError) {
        console.error('Failed to log action:', logError)
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', selectedUser.id))
      
      // Delete related data
      const collections = ['contracts', 'diplomas', 'skills']
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName))
        const toDelete = snapshot.docs.filter(doc => doc.data().userId === selectedUser.id)
        
        for (const doc of toDelete) {
          await deleteDoc(doc.ref)
        }
      }
      
      // Update local state
      setUsers(users.filter(user => user.id !== selectedUser.id))
      setShowDeleteDialog(false)
      setSelectedUser(null)
      
      toast({
        title: "Success",
        description: "User and related data deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage all user accounts and permissions</p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Admin Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.contractType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role || 'user'}
                      onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedUser?.name}</strong> and all their related data 
              (contracts, diplomas, skills). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}