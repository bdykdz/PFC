'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { Card, CardContent } from '@/components/ui/card'
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
import { Search, Trash2, GraduationCap, Calendar } from 'lucide-react'

interface Diploma {
  id: string
  name: string
  issuer: string
  date: Date
  expiryDate?: Date
  userId: string
  userName?: string
}

export default function AdminDiplomasPage() {
  const [diplomas, setDiplomas] = useState<Diploma[]>([])
  const [filteredDiplomas, setFilteredDiplomas] = useState<Diploma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiploma, setSelectedDiploma] = useState<Diploma | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [users, setUsers] = useState<Map<string, string>>(new Map())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter diplomas based on search term
    const filtered = diplomas.filter(diploma => 
      diploma.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diploma.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diploma.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredDiplomas(filtered)
  }, [searchTerm, diplomas])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch users first to get names
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersMap = new Map<string, string>()
      usersSnapshot.docs.forEach(doc => {
        usersMap.set(doc.id, doc.data().name)
      })
      setUsers(usersMap)

      // Fetch diplomas
      const diplomasSnapshot = await getDocs(collection(db, 'diplomas'))
      const diplomasData = diplomasSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          userName: usersMap.get(data.userId) || 'Unknown User',
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          expiryDate: data.expiryDate ? 
            (data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate)) : 
            undefined
        }
      }) as Diploma[]
      
      setDiplomas(diplomasData)
      setFilteredDiplomas(diplomasData)
    } catch (error) {
      console.error('Error fetching diplomas:', error)
      toast({
        title: "Error",
        description: "Failed to fetch diplomas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDiploma = async () => {
    if (!selectedDiploma) return

    try {
      await deleteDoc(doc(db, 'diplomas', selectedDiploma.id))
      
      // Update local state
      setDiplomas(diplomas.filter(diploma => diploma.id !== selectedDiploma.id))
      setShowDeleteDialog(false)
      setSelectedDiploma(null)
      
      toast({
        title: "Success",
        description: "Diploma deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting diploma:', error)
      toast({
        title: "Error",
        description: "Failed to delete diploma",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading diplomas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diplomas Management</h1>
        <p className="text-muted-foreground">View and manage all diplomas in the system</p>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, issuer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{diplomas.length}</div>
            <p className="text-xs text-muted-foreground">Total Diplomas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {diplomas.filter(d => d.expiryDate && new Date(d.expiryDate) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Valid Diplomas</p>
          </CardContent>
        </Card>
      </div>

      {/* Diplomas Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diploma Name</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiplomas.map((diploma) => {
                const isExpired = diploma.expiryDate && new Date(diploma.expiryDate) < new Date()
                return (
                  <TableRow key={diploma.id}>
                    <TableCell className="font-medium">{diploma.name}</TableCell>
                    <TableCell>{diploma.userName}</TableCell>
                    <TableCell>{diploma.issuer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(diploma.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {diploma.expiryDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(diploma.expiryDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {diploma.expiryDate ? (
                        <Badge variant={isExpired ? "destructive" : "default"}>
                          {isExpired ? 'Expired' : 'Valid'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Permanent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDiploma(diploma)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
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
              This will permanently delete the diploma <strong>{selectedDiploma?.name}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDiploma}
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