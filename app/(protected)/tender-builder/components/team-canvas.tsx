'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Users, 
  DollarSign, 
  Trash2,
  Edit,
  Calendar,
  MapPin,
  Star,
  X
} from 'lucide-react'
import { TenderProject, TenderTeam, TenderProjectMember } from '@/types/tender'

interface TeamCanvasProps {
  project: TenderProject
  selectedTeam: string | null
  onSelectTeam: (teamId: string | null) => void
  onUpdateProject: (project: TenderProject) => void
}

export function TeamCanvas({ 
  project, 
  selectedTeam, 
  onSelectTeam, 
  onUpdateProject 
}: TeamCanvasProps) {
  const [isNewTeamDialogOpen, setIsNewTeamDialogOpen] = useState(false)

  const createNewTeam = async (teamData: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/tender/projects/${project.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })
      
      if (response.ok) {
        const updatedProject = await response.json()
        onUpdateProject(updatedProject)
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const removeTeamMember = async (teamId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/tender/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh project data
        const projectResponse = await fetch(`/api/tender/projects/${project.id}`)
        const updatedProject = await projectResponse.json()
        onUpdateProject(updatedProject)
      }
    } catch (error) {
      console.error('Failed to remove team member:', error)
    }
  }

  const calculateTeamCost = (team: TenderTeam) => {
    return team.members.reduce((total, member) => {
      const rate = member.employee.hourlyRate || 0
      const allocation = (member.allocation || 100) / 100
      return total + (rate * allocation * 160) // 160 hours/month
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Teams Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Teams</h2>
          <p className="text-sm text-muted-foreground">
            {selectedTeam ? 'Click employees in the sidebar to add to selected team' : 'Select a team to add members'}
          </p>
        </div>
        
        <Dialog open={isNewTeamDialogOpen} onOpenChange={setIsNewTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Team
            </Button>
          </DialogTrigger>
          <NewTeamDialog 
            onCreateTeam={createNewTeam}
            onClose={() => setIsNewTeamDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {project.teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isSelected={selectedTeam === team.id}
            onSelect={() => onSelectTeam(selectedTeam === team.id ? null : team.id)}
            onRemoveMember={(memberId) => removeTeamMember(team.id, memberId)}
            cost={calculateTeamCost(team)}
          />
        ))}
        
        {/* Add Team Placeholder */}
        {project.teams.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No Teams Created</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first team to start building your tender submission
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsNewTeamDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Team Card Component
interface TeamCardProps {
  team: TenderTeam
  isSelected: boolean
  onSelect: () => void
  onRemoveMember: (memberId: string) => void
  cost: number
}

function TeamCard({ team, isSelected, onSelect, onRemoveMember, cost }: TeamCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {isSelected && <Users className="h-5 w-5 text-primary" />}
              {team.name}
            </CardTitle>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {team.description}
              </p>
            )}
          </div>
          
          {isSelected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
        </div>
        
        {/* Team Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{team.members.length} members</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>€{cost.toLocaleString()}/month</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Team Members */}
        <div className="space-y-3">
          {team.members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onRemove={() => onRemoveMember(member.id)}
            />
          ))}
          
          {team.members.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs">
                {isSelected ? 'Add members from the sidebar' : 'Select this team to add members'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Team Member Card Component  
interface TeamMemberCardProps {
  member: TenderProjectMember
  onRemove: () => void
}

function TeamMemberCard({ member, onRemove }: TeamMemberCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{member.employee.name}</h4>
          {member.employee.isKeyExpert && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">{member.role}</p>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {member.employee.yearsExperience && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{member.employee.yearsExperience}y exp</span>
            </div>
          )}
          {member.employee.hourlyRate && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>€{member.employee.hourlyRate}/h</span>
            </div>
          )}
          {member.allocation && (
            <Badge variant="outline" className="text-xs">
              {member.allocation}%
            </Badge>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// New Team Dialog Component
function NewTeamDialog({ 
  onCreateTeam, 
  onClose 
}: { 
  onCreateTeam: (data: { name: string; description?: string }) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTeam({
      name: formData.name,
      description: formData.description || undefined
    })
    setFormData({ name: '', description: '' })
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Technical Team, Management Team, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teamDescription">Description</Label>
            <Textarea
              id="teamDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of team responsibilities..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name}>
            Create Team
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}