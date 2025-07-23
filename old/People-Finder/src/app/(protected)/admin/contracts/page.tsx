'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
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
import { Search, Trash2, FileText, Calendar, MapPin } from 'lucide-react'

interface Contract {
  id: string
  name: string
  position: string
  location: string
  beneficiary: string
  startDate: Date
  endDate: Date
  userId: string
  userName?: string
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [users, setUsers] = useState<Map<string, string>>(new Map())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter contracts based on search term
    const filtered = contracts.filter(contract => 
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredContracts(filtered)
  }, [searchTerm, contracts])

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

      // Fetch contracts
      const contractsSnapshot = await getDocs(collection(db, 'contracts'))
      const contractsData = contractsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          userName: usersMap.get(data.userId) || 'Unknown User',
          startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
        }
      }) as Contract[]
      
      setContracts(contractsData)
      setFilteredContracts(contractsData)
    } catch (error) {
      console.error('Error fetching contracts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async () => {
    if (!selectedContract) return

    try {
      await deleteDoc(doc(db, 'contracts', selectedContract.id))
      
      // Update local state
      setContracts(contracts.filter(contract => contract.id !== selectedContract.id))
      setShowDeleteDialog(false)
      setSelectedContract(null)
      
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting contract:', error)
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive"
      })
    }
  }

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffInMs = endDate.getTime() - startDate.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    const years = Math.floor(diffInDays / 365)
    const months = Math.floor((diffInDays % 365) / 30)
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`
    }
    return `${months} month${months > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading contracts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracts Management</h1>
        <p className="text-muted-foreground">View and manage all contracts in the system</p>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, position, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">Total Contracts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {contracts.filter(c => new Date(c.endDate) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Active Contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Name</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const isActive = new Date(contract.endDate) > new Date()
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.name}</TableCell>
                    <TableCell>{contract.userName}</TableCell>
                    <TableCell>{contract.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {contract.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(contract.startDate).toLocaleDateString()} - 
                          {new Date(contract.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {calculateDuration(new Date(contract.startDate), new Date(contract.endDate))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? 'Active' : 'Expired'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract)
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
              This will permanently delete the contract <strong>{selectedContract?.name}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
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