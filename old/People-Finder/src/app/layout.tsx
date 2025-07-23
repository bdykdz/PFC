// src/app/layout.tsx
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-inter'
})

export const metadata = {
  title: 'Professional Finder',
  description: 'Find and manage professional profiles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}