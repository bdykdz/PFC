import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth-options'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Users, UserPlus, Settings, LogOut, Shield, Activity, Database, UserMinus, FileSearch } from 'lucide-react'
import { Toaster } from 'sonner'
import { LanguageSwitcher } from '@/components/language-switcher'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const initials = session.user.name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span className="font-bold text-xl">People Finder</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/search"
                  className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Link>
                <Link
                  href="/document-search"
                  className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FileSearch className="h-4 w-4" />
                  <span>Document Search</span>
                </Link>
                {session.user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin/users"
                      className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                    <Link
                      href="/admin/setup"
                      className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Import</span>
                    </Link>
                  </>
                )}
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {(session.user.role === 'admin' || session.user.role === 'editor') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dropdowns" className="cursor-pointer">
                          <Database className="mr-2 h-4 w-4" />
                          <span>Manage Dropdowns</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/employees" className="cursor-pointer">
                          <UserMinus className="mr-2 h-4 w-4" />
                          <span>Manage Employees</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {session.user.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Manage Users</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/activity" className="cursor-pointer">
                          <Activity className="mr-2 h-4 w-4" />
                          <span>Activity Log</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/auth/signout" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}