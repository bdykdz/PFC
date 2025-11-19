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
  MapPin,
  AlertCircle,
  X
} from 'lucide-react'
import { TenderProject, TenderTeam, TenderEmployee, TenderSearchFilters } from '@/types/tender'
import { EmployeeCard } from './components/employee-card'
import { TeamCanvas } from './components/team-canvas'
import { ProjectHeader } from './components/project-header'
import { AdvancedEmployeeFilters } from './components/advanced-employee-filters'

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
  const [error, setError] = useState<string | null>(null)

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
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (emp.department && emp.department.toLowerCase().includes(query)) ||
        (emp.expertise && emp.expertise.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (filters.projectCategories?.length) {
      filtered = filtered.filter(emp => 
        emp.projectCategories && Array.isArray(emp.projectCategories) &&
        emp.projectCategories.some(cat => filters.projectCategories?.includes(cat))
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
      setError(null)
      const response = await fetch('/api/employees/tender')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const employees = await response.json()
      setAvailableEmployees(employees)
      setFilteredEmployees(employees)
    } catch (error) {
      console.error('Failed to load employees:', error)
      setError('Failed to load employees. Please try again.')
      setAvailableEmployees([])
      setFilteredEmployees([])
    }
  }

  const loadProjects = async () => {
    try {
      setError(null)
      const response = await fetch('/api/tender/projects')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const projects = await response.json()
      // Set first project as current if any exist
      if (projects && projects.length > 0) {
        setCurrentProject(projects[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load projects:', error)
      setError('Failed to load projects. Please try again.')
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
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="text-red-700">{error}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

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

      {/* Main Content - Three Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[800px]">
        {/* Left Panel: Employee Pool */}
        <div className="xl:col-span-3 space-y-4">
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

              {/* Advanced Filters */}
              <AdvancedEmployeeFilters
                filters={filters}
                onFiltersChange={setFilters}
                employeeCount={filteredEmployees.length}
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

        {/* Center Panel: Team Canvas */}
        <div className="xl:col-span-6">
          {currentProject ? (
            <TeamCanvas
              project={currentProject}
              onSelectTeam={setSelectedTeam}
              selectedTeam={selectedTeam}
              onUpdateProject={setCurrentProject}
            />
          ) : (
            <Card className="border-dashed h-full">
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

        {/* Right Panel: Team Summary & Export */}
        <div className="xl:col-span-3 space-y-4">
          {currentProject ? (
            <TeamSummaryPanel
              project={currentProject}
              totalCost={calculateProjectCost()}
              selectedTeam={selectedTeam}
            />
          ) : (
            <Card className="border-dashed h-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileDown className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">Team Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Project details and export options will appear here
                </p>
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

// Team Summary Panel Component
interface TeamSummaryPanelProps {
  project: TenderProject
  totalCost: number
  selectedTeam: string | null
}

function TeamSummaryPanel({ project, totalCost, selectedTeam }: TeamSummaryPanelProps) {
  const totalMembers = project.teams.reduce((sum, team) => sum + team.members.length, 0)
  const selectedTeamData = selectedTeam ? project.teams.find(t => t.id === selectedTeam) : null

  const exportTeamSummary = async () => {
    try {
      const response = await fetch(`/api/tender/projects/${project.id}/export`, {
        method: 'GET',
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_team_summary.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export team summary:', error)
    }
  }

  const exportTeamAsJSON = () => {
    const exportData = {
      project: {
        name: project.name,
        client: project.client,
        category: project.projectCategory,
        estimatedValue: project.estimatedValue,
        submissionDate: project.submissionDate
      },
      teams: project.teams.map(team => ({
        name: team.name,
        description: team.description,
        members: team.members.map(member => ({
          name: member.employee.name,
          role: member.role,
          hourlyRate: member.employee.hourlyRate,
          allocation: member.allocation,
          experience: member.employee.yearsExperience,
          skills: member.employee.skills.map(s => s.name)
        }))
      })),
      summary: {
        totalMembers,
        totalMonthlyCost: totalCost,
        averageExperience: Math.round(
          project.teams.flatMap(t => t.members).reduce((sum, m) => sum + (m.employee.yearsExperience || 0), 0) / 
          Math.max(1, totalMembers)
        )
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_team_data.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <>
      {/* Project Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalMembers}</div>
              <div className="text-xs text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">€{Math.round(totalCost/1000)}k</div>
              <div className="text-xs text-muted-foreground">Monthly Cost</div>
            </div>
          </div>

          {/* Project Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Team Progress</span>
              <span>{project.teams.length} teams</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(100, (totalMembers / 10) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-muted-foreground">
              {totalMembers < 5 ? 'Building team...' : 
               totalMembers < 10 ? 'Good progress' : 
               'Team ready!'}
            </div>
          </div>

          {/* Export Options */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Options</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" onClick={exportTeamSummary} className="justify-start gap-2">
                <FileDown className="h-4 w-4" />
                Export PDF Report
              </Button>
              <Button variant="outline" size="sm" onClick={exportTeamAsJSON} className="justify-start gap-2">
                <Save className="h-4 w-4" />
                Export Data (JSON)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Team Details */}
      {selectedTeamData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedTeamData.name}
              <Badge variant="default" className="text-xs">Selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTeamData.description && (
              <p className="text-sm text-muted-foreground">{selectedTeamData.description}</p>
            )}
            
            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{selectedTeamData.members.length}</div>
                <div className="text-xs text-blue-600">Members</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  €{Math.round(selectedTeamData.members.reduce((sum, m) => {
                    const rate = m.employee.hourlyRate || 0
                    const allocation = (m.allocation || 100) / 100
                    return sum + (rate * allocation * 160)
                  }, 0) / 1000)}k
                </div>
                <div className="text-xs text-green-600">Monthly</div>
              </div>
            </div>

            {/* Team Member List */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Team Members</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedTeamData.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{member.employee.name}</span>
                        {member.employee.isKeyExpert && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </div>
                    {member.allocation && member.allocation !== 100 && (
                      <Badge variant="outline" className="text-xs">
                        {member.allocation}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.teams.map((team) => {
            const teamCost = team.members.reduce((sum, member) => {
              const rate = member.employee.hourlyRate || 0
              const allocation = (member.allocation || 100) / 100
              return sum + (rate * allocation * 160)
            }, 0)
            
            return (
              <div key={team.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{team.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {team.members.length} members
                  </Badge>
                </div>
                <div className="text-sm font-bold">
                  €{teamCost.toLocaleString()}
                </div>
              </div>
            )
          })}
          
          <Separator />
          <div className="flex justify-between items-center font-bold">
            <span>Total Monthly Cost</span>
            <span className="text-lg text-primary">€{totalCost.toLocaleString()}</span>
          </div>
          
          {project.estimatedValue && (
            <div className="text-xs text-muted-foreground text-center">
              {((totalCost * 12) / project.estimatedValue * 100).toFixed(1)}% of project value
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}