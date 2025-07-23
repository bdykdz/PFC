'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"
import { Search, UserPlus, Shield } from 'lucide-react'

export default function ProtectedLayoutClient({
  children,
  isAdmin = false
}: {
  children: React.ReactNode
  isAdmin?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Search Profiles',
      href: '/search',
      icon: Search,
      current: pathname === '/search'
    },
    {
      name: 'Add Person',
      href: '/add-person',
      icon: UserPlus,
      current: pathname === '/add-person'
    }
  ]
  
  // Add admin link if user is admin
  if (isAdmin) {
    navigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      current: pathname.startsWith('/admin')
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-2 rounded">
        Skip to main content
      </a>
      
      {/* Top Header */}
      <header className="fixed top-0 z-50 w-full bg-white dark:bg-background border-b" role="banner">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Image
            src="/placeholder.svg"
            alt="People Finder Logo"
            width={120}
            height={100}
            className="cursor-pointer"
            onClick={() => router.push('/search')}
          />
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <aside className="w-64 fixed h-full bg-white dark:bg-background border-r" role="navigation" aria-label="Main navigation">
          <nav className="p-4 space-y-2" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  item.current
                    ? "bg-primary text-white dark:bg-primary"
                    : "text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted"
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="pl-64 w-full" role="main" id="main-content">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}