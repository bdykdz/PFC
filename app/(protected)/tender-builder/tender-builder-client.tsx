'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Users, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Building, 
  Target,
  FileDown,
  Save,
  Trash2,
  UserPlus,
  Star,
  Shield,
  Clock,
  MapPin
} from 'lucide-react'
import { TenderProject, TenderTeam, TenderEmployee, TenderSearchFilters } from '@/types/tender'
import { EmployeeCard } from './components/employee-card'
import { TeamCanvas } from './components/team-canvas'
import { ProjectHeader } from './components/project-header'
import { EmployeeFilters } from './components/employee-filters'

export function TenderBuilderClient() {
  const { t } = useI18n()
  const [currentProject, setCurrentProject] = useState<TenderProject | null>(null)
  const [availableEmployees, setAvailableEmployees] = useState<TenderEmployee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<TenderEmployee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TenderSearchFilters>({})
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load employees and projects
  useEffect(() => {
    loadEmployees()
    loadProjects()
  }, [])

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = availableEmployees

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.expertise?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    if (filters.projectCategories?.length) {
      filtered = filtered.filter(emp => 
        emp.projectCategories?.some(cat => filters.projectCategories?.includes(cat))
      )
    }

    if (filters.securityClearance?.length) {
      filtered = filtered.filter(emp => 
        emp.securityClearance && filters.securityClearance?.includes(emp.securityClearance)
      )
    }

    if (filters.availabilityStatus?.length) {
      filtered = filtered.filter(emp => 
        emp.availabilityStatus && filters.availabilityStatus?.includes(emp.availabilityStatus)
      )
    }

    if (filters.isKeyExpert !== undefined) {
      filtered = filtered.filter(emp => emp.isKeyExpert === filters.isKeyExpert)
    }

    if (filters.yearsExperience?.min !== undefined) {
      filtered = filtered.filter(emp => 
        (emp.yearsExperience || 0) >= filters.yearsExperience!.min!
      )
    }

    if (filters.yearsExperience?.max !== undefined) {
      filtered = filtered.filter(emp => 
        (emp.yearsExperience || 0) <= filters.yearsExperience!.max!
      )
    }

    setFilteredEmployees(filtered)
  }, [availableEmployees, searchQuery, filters])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees/tender')
      const employees = await response.json()
      setAvailableEmployees(employees)
      setFilteredEmployees(employees)
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/tender/projects')
      const projects = await response.json()
      // Set first project as current if any exist
      if (projects.length > 0) {
        setCurrentProject(projects[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load projects:', error)
      setLoading(false)
    }
  }

  const createNewProject = async (projectData: Partial<TenderProject>) => {
    try {
      const response = await fetch('/api/tender/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      const newProject = await response.json()
      setCurrentProject(newProject)
      setIsNewProjectDialogOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const addEmployeeToTeam = async (employeeId: string, teamId: string, role: string) => {
    if (!currentProject) return

    try {
      const response = await fetch(`/api/tender/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, role })
      })
      
      if (response.ok) {
        // Refresh project data
        loadProjects()
      }
    } catch (error) {
      console.error('Failed to add team member:', error)
    }
  }

  const calculateProjectCost = () => {
    if (!currentProject) return 0
    
    return currentProject.teams.reduce((total, team) => {
      return total + team.members.reduce((teamTotal, member) => {
        const rate = member.employee.hourlyRate || 0
        const allocation = (member.allocation || 100) / 100
        return teamTotal + (rate * allocation * 160) // Assuming 160 hours/month
      }, 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tender builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tender Team Builder</h1>
          <p className="text-muted-foreground">
            Assemble project teams for tender submissions and generate team documentation
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <NewProjectDialog 
              onCreateProject={createNewProject}
              onClose={() => setIsNewProjectDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {/* Project Header */}
      {currentProject && (
        <ProjectHeader 
          project={currentProject}
          totalCost={calculateProjectCost()}
          onUpdateProject={setCurrentProject}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Employee Pool (Left Sidebar) */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Team ({filteredEmployees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <EmployeeFilters
                filters={filters}
                onFiltersChange={setFilters}
              />

              {/* Employee List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onAddToTeam={(role) => {
                      if (selectedTeam) {
                        addEmployeeToTeam(employee.id, selectedTeam, role)
                      }
                    }}
                    showAddButton={!!selectedTeam}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Canvas (Main Area) */}
        <div className="xl:col-span-3">
          {currentProject ? (
            <TeamCanvas
              project={currentProject}
              onSelectTeam={setSelectedTeam}
              selectedTeam={selectedTeam}
              onUpdateProject={setCurrentProject}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a new tender project to start building your team
                </p>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// New Project Dialog Component
function NewProjectDialog({ 
  onCreateProject, 
  onClose 
}: { 
  onCreateProject: (data: Partial<TenderProject>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    projectCategory: '',
    submissionDate: '',
    estimatedValue: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateProject({
      ...formData,
      submissionDate: formData.submissionDate ? new Date(formData.submissionDate) : undefined,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined
    })
  }

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create New Tender Project</DialogTitle>
          <DialogDescription>
            Set up a new project for tender submission
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Highway Infrastructure Project"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              placeholder="Ministry of Transportation"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.projectCategory}
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectCategory: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="IT & Software">IT & Software</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Water & Utilities">Water & Utilities</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="submissionDate">Submission Date</Label>
            <Input
              id="submissionDate"
              type="date"
              value={formData.submissionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, submissionDate: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Estimated Value (EUR)</Label>
            <Input
              id="estimatedValue"
              type="number"
              value={formData.estimatedValue}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
              placeholder="1000000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Project requirements and scope..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name}>
            Create Project
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}