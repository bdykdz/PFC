// src/components/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: '/search',
      label: 'Search',
      active: pathname === '/search',
    },
    {
      href: '/add-person',
      label: 'Add Person',
      active: pathname === '/add-person',
    }
  ]

  return (
    <nav className="flex items-center space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active ? 
              "text-black dark:text-white" : 
              "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}