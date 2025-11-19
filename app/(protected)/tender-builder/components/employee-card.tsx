'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { 
  Star, 
  Shield, 
  MapPin, 
  Clock, 
  DollarSign, 
  UserPlus,
  Calendar,
  Languages,
  Award
} from 'lucide-react'
import { TenderEmployee } from '@/types/tender'

interface EmployeeCardProps {
  employee: TenderEmployee
  onAddToTeam?: (role: string) => void
  showAddButton?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function EmployeeCard({ 
  employee, 
  onAddToTeam, 
  showAddButton = false,
  isSelected = false,
  onClick 
}: EmployeeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [role, setRole] = useState('')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvailabilityColor = (status?: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'On Leave':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Unavailable':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getClearanceColor = (clearance?: string) => {
    switch (clearance) {
      case 'Public':
        return 'bg-blue-100 text-blue-800'
      case 'Confidential':
        return 'bg-orange-100 text-orange-800'
      case 'Secret':
        return 'bg-red-100 text-red-800'
      case 'Top Secret':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddToTeam = () => {
    if (onAddToTeam && role.trim()) {
      onAddToTeam(role.trim())
      setRole('')
      setIsAddDialogOpen(false)
    }
  }

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={employee.profileImageUrl} />
              <AvatarFallback className="text-sm font-medium">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>

            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {employee.name}
                    </h3>
                    {employee.isKeyExpert && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {employee.department || 'No department'}
                  </p>
                </div>

                {showAddButton && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add {employee.name} to Team</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Role in Project</Label>
                          <Input
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g., Senior Engineer, Project Manager"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddToTeam} disabled={!role.trim()}>
                          Add to Team
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {employee.yearsExperience && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{employee.yearsExperience}y</span>
                  </div>
                )}
                {employee.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>€{employee.hourlyRate}/h</span>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{employee.location}</span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getAvailabilityColor(employee.availabilityStatus)}`}
                >
                  {employee.availabilityStatus || 'Unknown'}
                </Badge>
                
                {employee.securityClearance && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getClearanceColor(employee.securityClearance)}`}
                  >
                    <Shield className="h-2 w-2 mr-1" />
                    {employee.securityClearance}
                  </Badge>
                )}
              </div>

              {/* Project Categories */}
              {employee.projectCategories && employee.projectCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {employee.projectCategories.slice(0, 2).map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {employee.projectCategories.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{employee.projectCategories.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Top Skills */}
              {employee.skills && employee.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {employee.skills.slice(0, 2).map((skill) => (
                    <Badge key={skill.name} variant="outline" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                  {employee.skills.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.skills.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Languages */}
              {employee.languages && employee.languages.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Languages className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {employee.languages.map(l => l.language).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}