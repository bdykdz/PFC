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
import { Search, Trash2, Brain, Sparkles, Zap } from 'lucide-react'

interface Skill {
  id: string
  name: string
  level: 'Începător' | 'Intermediar' | 'Expert'
  type: 'Soft' | 'Hard'
  userId: string
  userName?: string
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [users, setUsers] = useState<Map<string, string>>(new Map())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter skills based on search term
    const filtered = skills.filter(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSkills(filtered)
  }, [searchTerm, skills])

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

      // Fetch skills
      const skillsSnapshot = await getDocs(collection(db, 'skills'))
      const skillsData = skillsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          userName: usersMap.get(data.userId) || 'Unknown User'
        }
      }) as Skill[]
      
      setSkills(skillsData)
      setFilteredSkills(skillsData)
    } catch (error) {
      console.error('Error fetching skills:', error)
      toast({
        title: "Error",
        description: "Failed to fetch skills",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSkill = async () => {
    if (!selectedSkill) return

    try {
      await deleteDoc(doc(db, 'skills', selectedSkill.id))
      
      // Update local state
      setSkills(skills.filter(skill => skill.id !== selectedSkill.id))
      setShowDeleteDialog(false)
      setSelectedSkill(null)
      
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting skill:', error)
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive"
      })
    }
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'default'
      case 'Intermediar':
        return 'secondary'
      case 'Începător':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Expert':
        return <Zap className="h-3 w-3" />
      case 'Intermediar':
        return <Sparkles className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading skills...</p>
        </div>
      </div>
    )
  }

  // Group skills by user for better overview
  const skillsByUser = skills.reduce((acc, skill) => {
    if (!acc[skill.userId]) {
      acc[skill.userId] = {
        userName: skill.userName || 'Unknown',
        skills: []
      }
    }
    acc[skill.userId].skills.push(skill)
    return acc
  }, {} as Record<string, { userName: string, skills: Skill[] }>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skills Management</h1>
        <p className="text-muted-foreground">View and manage all skills in the system</p>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by skill name or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">Total Skills</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {skills.filter(s => s.type === 'Hard').length}
            </div>
            <p className="text-xs text-muted-foreground">Hard Skills</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {skills.filter(s => s.type === 'Soft').length}
            </div>
            <p className="text-xs text-muted-foreground">Soft Skills</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill Name</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      {skill.name}
                    </div>
                  </TableCell>
                  <TableCell>{skill.userName}</TableCell>
                  <TableCell>
                    <Badge variant={skill.type === 'Hard' ? 'default' : 'secondary'}>
                      {skill.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(skill.level)}>
                      <div className="flex items-center gap-1">
                        {getLevelIcon(skill.level)}
                        {skill.level}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSkill(skill)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Skills by User Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Summary by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(skillsByUser).map(([userId, data]) => (
              <Card key={userId}>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">{data.userName}</h4>
                  <div className="space-y-1 text-sm">
                    <p>Total Skills: {data.skills.length}</p>
                    <p>Hard Skills: {data.skills.filter(s => s.type === 'Hard').length}</p>
                    <p>Soft Skills: {data.skills.filter(s => s.type === 'Soft').length}</p>
                    <p>Expert Level: {data.skills.filter(s => s.level === 'Expert').length}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the skill <strong>{selectedSkill?.name}</strong> for {selectedSkill?.userName}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSkill}
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