import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Database, Shield, Activity, FileText } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and maintenance tasks</p>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Application Version</p>
              <p className="text-2xl font-bold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium">Environment</p>
              <Badge>Production</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-sm text-muted-foreground">Firebase Firestore</p>
            </div>
            <div>
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">Firebase Auth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage database operations and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Database</p>
              <p className="text-sm text-muted-foreground">Download a backup of all data</p>
            </div>
            <Button variant="outline" disabled>
              Export Data
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">Clear temporary cached data</p>
            </div>
            <Button variant="outline" disabled>
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and access control settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">Current: 5 days</p>
            </div>
            <Badge variant="secondary">5 days</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Admin Role Required</p>
              <p className="text-sm text-muted-foreground">Only admins can access this panel</p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            View and manage system audit logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Log Retention</p>
              <p className="text-sm text-muted-foreground">Logs are kept for 90 days</p>
            </div>
            <Badge variant="secondary">90 days</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Logs</p>
              <p className="text-sm text-muted-foreground">Download audit logs as CSV</p>
            </div>
            <Button variant="outline" disabled>
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation
          </CardTitle>
          <CardDescription>
            Access system documentation and guides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Admin Guide</p>
            <p className="text-sm text-muted-foreground">
              Learn how to manage users, contracts, and system settings effectively.
            </p>
          </div>
          <div>
            <p className="font-medium">API Documentation</p>
            <p className="text-sm text-muted-foreground">
              Technical documentation for developers and integrations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}