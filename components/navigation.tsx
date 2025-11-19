'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, FileSearch, Shield, UserPlus, Menu, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet'

interface NavigationProps {
  userRole: string
}

export function Navigation({ userRole }: NavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      href: '/search',
      label: 'People',
      icon: Search,
      active: pathname.startsWith('/search') || pathname === '/',
    },
    {
      href: '/document-search',
      label: 'Documents',
      icon: FileSearch,
      active: pathname.startsWith('/document-search'),
    },
    {
      href: '/tender-builder',
      label: 'Team Builder',
      icon: Users,
      active: pathname.startsWith('/tender-builder'),
    },
  ]

  const adminItems = userRole === 'admin' ? [
    {
      href: '/admin/users',
      label: 'Users',
      icon: Shield,
      active: pathname.startsWith('/admin/users'),
    },
    {
      href: '/admin/setup',
      label: 'Import',
      icon: UserPlus,
      active: pathname.startsWith('/admin/setup'),
    },
  ] : []

  const allItems = [...navItems, ...adminItems]

  const NavLink = ({ item, onClick = () => {} }: { item: typeof navItems[0], onClick?: () => void }) => {
    const IconComponent = item.icon
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          item.active
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <IconComponent className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-1">
        {allItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Mobile Navigation */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="sm" className="px-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {allItems.map((item) => (
              <NavLink key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}