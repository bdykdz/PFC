import { validateAdminSession } from '@/lib/admin-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  GraduationCap, 
  Brain, 
  LayoutDashboard,
  Settings,
  LogOut,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminUser = await validateAdminSession()
  
  if (!adminUser) {
    redirect('/search')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold">Admin Panel</h2>
                <p className="text-sm text-muted-foreground">{adminUser.name || adminUser.email}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </Link>
              
              <Link href="/admin/contracts">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Contracts
                </Button>
              </Link>
              
              <Link href="/admin/diplomas">
                <Button variant="ghost" className="w-full justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Diplomas
                </Button>
              </Link>
              
              <Link href="/admin/skills">
                <Button variant="ghost" className="w-full justify-start">
                  <Brain className="mr-2 h-4 w-4" />
                  Skills
                </Button>
              </Link>
              
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </nav>
          
          <div className="p-4 border-t">
            <Link href="/search">
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}