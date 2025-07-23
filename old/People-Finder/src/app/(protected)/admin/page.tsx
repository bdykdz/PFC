import { db } from '@/lib/firebase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, GraduationCap, Brain, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  try {
    const [usersSnapshot, contractsSnapshot, diplomasSnapshot, skillsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('contracts').get(),
      db.collection('diplomas').get(),
      db.collection('skills').get()
    ])

    // Get recent activity
    const recentLogs = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()

    const recentActivity = recentLogs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return {
      users: usersSnapshot.size,
      contracts: contractsSnapshot.size,
      diplomas: diplomasSnapshot.size,
      skills: skillsSnapshot.size,
      recentActivity
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      users: 0,
      contracts: 0,
      diplomas: 0,
      skills: 0,
      recentActivity: []
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, contracts, and system data</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Manage all users
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/contracts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contracts}</div>
              <p className="text-xs text-muted-foreground">
                Active contracts
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/diplomas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Diplomas</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.diplomas}</div>
              <p className="text-xs text-muted-foreground">
                Verified credentials
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/skills">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.skills}</div>
              <p className="text-xs text-muted-foreground">
                Tracked skills
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.targetType} • {activity.targetId}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp?.toDate?.() || activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/users/new">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <p className="font-medium">Add New User</p>
                  <p className="text-sm text-muted-foreground">Create a new user profile</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/contracts">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <p className="font-medium">Manage Contracts</p>
                  <p className="text-sm text-muted-foreground">View and edit all contracts</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/settings">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <p className="font-medium">System Settings</p>
                  <p className="text-sm text-muted-foreground">Configure system preferences</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}