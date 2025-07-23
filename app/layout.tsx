import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n/context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'People Finder',
  description: 'Professional profile management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <I18nProvider>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </body>
    </html>
  )
}