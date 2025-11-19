'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Building, 
  DollarSign, 
  Users, 
  FileDown, 
  Edit,
  Target
} from 'lucide-react'
import { TenderProject } from '@/types/tender'
import { format } from 'date-fns'

interface ProjectHeaderProps {
  project: TenderProject
  totalCost: number
  onUpdateProject: (project: TenderProject) => void
}

export function ProjectHeader({ project, totalCost, onUpdateProject }: ProjectHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'Won':
        return 'bg-green-100 text-green-800'
      case 'Lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilSubmission = () => {
    if (!project.submissionDate) return null
    const now = new Date()
    const submission = new Date(project.submissionDate)
    const diffTime = submission.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilSubmission = getDaysUntilSubmission()
  const totalMembers = project.teams.reduce((sum, team) => sum + team.members.length, 0)

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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Project Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                {daysUntilSubmission !== null && (
                  <Badge variant={daysUntilSubmission > 7 ? "secondary" : "destructive"}>
                    {daysUntilSubmission > 0 
                      ? `${daysUntilSubmission} days left`
                      : daysUntilSubmission === 0 
                        ? 'Due today'
                        : `${Math.abs(daysUntilSubmission)} days overdue`
                    }
                  </Badge>
                )}
              </div>
              
              {project.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
              <Button onClick={exportTeamSummary} size="sm" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export Team
              </Button>
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Client */}
            {project.client && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Client</span>
                </div>
                <p className="font-medium">{project.client}</p>
              </div>
            )}

            {/* Category */}
            {project.projectCategory && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Category</span>
                </div>
                <p className="font-medium">{project.projectCategory}</p>
              </div>
            )}

            {/* Submission Date */}
            {project.submissionDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
                <p className="font-medium">
                  {format(new Date(project.submissionDate), 'MMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Team Size */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team Size</span>
              </div>
              <p className="font-medium">
                {totalMembers} member{totalMembers !== 1 ? 's' : ''} 
                <span className="text-sm text-muted-foreground ml-1">
                  in {project.teams.length} team{project.teams.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>

            {/* Monthly Cost */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Monthly Cost</span>
              </div>
              <p className="font-medium">
                €{totalCost.toLocaleString()}
                {project.estimatedValue && (
                  <span className="text-sm text-muted-foreground ml-1">
                    / €{project.estimatedValue.toLocaleString()} total
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {project.requirements && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm mb-2">Project Requirements</h3>
              <div className="space-y-2">
                {typeof project.requirements === 'object' && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(project.requirements).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}