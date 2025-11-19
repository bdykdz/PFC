'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart,
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  PieChart,
  Activity
} from 'lucide-react'
import { CapabilityReport } from '@/types/tender'

interface AnalyticsData {
  capabilityReport: CapabilityReport
  teamCostAnalysis: {
    averageTeamCost: number
    costByCategory: Array<{ category: string; cost: number }>
    costTrends: Array<{ month: string; cost: number }>
  }
  gapAnalysis: {
    criticalGaps: Array<{ skill: string; required: number; available: number }>
    categoryGaps: Array<{ category: string; coverage: number; gap: number }>
  }
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('6months')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedCategory, timeRange])

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/capability?category=${selectedCategory}&range=${timeRange}`)
      const analyticsData = await response.json()
      setData(analyticsData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, timeRange })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `capability_report_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capability Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights for tender preparation and team optimization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="IT & Software">IT & Software</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="Water & Utilities">Water & Utilities</SelectItem>
              <SelectItem value="Transportation">Transportation</SelectItem>
              <SelectItem value="Energy">Energy</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              const response = await fetch('/api/admin/seed-tender', { method: 'POST' })
              const result = await response.json()
              console.log(result)
              if (response.ok) {
                window.location.reload()
              }
            }} 
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Seed Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.capabilityReport.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {data.capabilityReport.availableEmployees} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Experts</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.capabilityReport.keyExperts}</div>
              <p className="text-xs text-muted-foreground">
                {((data.capabilityReport.keyExperts / data.capabilityReport.totalEmployees) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{data.capabilityReport.averageRate}</div>
              <p className="text-xs text-muted-foreground">per hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{Math.round(data.teamCostAnalysis.averageTeamCost/1000)}k</div>
              <p className="text-xs text-muted-foreground">avg monthly</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="capability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capability">Capability Overview</TabsTrigger>
          <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
        </TabsList>

        {/* Capability Overview */}
        <TabsContent value="capability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.capabilityReport.categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span>{item.count} people ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Experience Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Experience Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.capabilityReport.experienceBreakdown.map((item) => (
                  <div key={item.range} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.range}</span>
                      <span>{item.count} people ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Security Clearance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Clearance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data?.capabilityReport.securityClearanceBreakdown.map((item) => (
                  <div key={item.level} className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{item.count}</div>
                    <div className="text-sm font-medium">{item.level}</div>
                    <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Analysis */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Skills by Expertise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.capabilityReport.topSkills.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{skill.expertCount} experts</Badge>
                      <span className="text-sm text-muted-foreground">
                        {skill.totalCount} total
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(skill.expertCount / skill.totalCount) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((skill.expertCount / skill.totalCount) * 100).toFixed(1)}% expert level
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.teamCostAnalysis.costByCategory.map((item) => (
                  <div key={item.category} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-bold">€{item.cost.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cost Estimation Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Small Team (3-5 people)</span>
                      <Badge variant="outline">€8k-15k/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ideal for specialized projects or support roles
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Medium Team (6-10 people)</span>
                      <Badge variant="outline">€15k-30k/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Standard project teams with diverse skills
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Large Team (10+ people)</span>
                      <Badge variant="outline">€30k+/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complex projects requiring multiple specialists
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gap Analysis */}
        <TabsContent value="gaps" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Skills Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Critical Skills Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.gapAnalysis.criticalGaps.map((gap) => (
                  <div key={gap.skill} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{gap.skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">
                          {gap.available}/{gap.required}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {gap.required - gap.available} needed
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(gap.available / gap.required) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Category Coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Category Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.gapAnalysis.categoryGaps.map((gap) => (
                  <div key={gap.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{gap.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {gap.coverage.toFixed(1)}% covered
                        </span>
                        {gap.coverage >= 80 ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            Strong
                          </Badge>
                        ) : gap.coverage >= 60 ? (
                          <Badge variant="outline" className="text-xs">
                            Adequate
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Weak
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          gap.coverage >= 80 ? 'bg-green-500' : 
                          gap.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${gap.coverage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-2">Hiring Priority</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Senior Water Engineers</li>
                    <li>• Project Management Specialists</li>
                    <li>• Security Cleared Personnel</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-900 mb-2">Training Focus</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Advanced certification programs</li>
                    <li>• Cross-category skill development</li>
                    <li>• Leadership development</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg bg-orange-50">
                  <h4 className="font-medium text-orange-900 mb-2">Partnership</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Subcontractor relationships</li>
                    <li>• Freelancer networks</li>
                    <li>• Consulting partnerships</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h4 className="font-medium text-purple-900 mb-2">Internal Development</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Mentorship programs</li>
                    <li>• Skill certification tracks</li>
                    <li>• Performance improvement plans</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}