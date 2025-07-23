'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n/context'

export default function LoginPage() {
  const { t } = useI18n()
  
  const handleSignIn = () => {
    signIn('azure-ad', { callbackUrl: '/search' })
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <LanguageSwitcher />
      </div>
      <Card style={{ width: '100%', maxWidth: '28rem', padding: '1rem' }}>
        <CardHeader style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <CardTitle style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {t('auth.welcomeTitle')}
          </CardTitle>
          <CardDescription style={{ fontSize: '1rem', color: '#6b7280' }}>
            {t('auth.signInDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSignIn}
            style={{ 
              width: '100%', 
              padding: '0.75rem 1.5rem',
              fontSize: '1.125rem',
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#106ebe'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0078d4'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 0H0V9.5H9.5V0Z" fill="#F25022"/>
              <path d="M20 0H10.5V9.5H20V0Z" fill="#7FBA00"/>
              <path d="M9.5 10.5H0V20H9.5V10.5Z" fill="#00A4EF"/>
              <path d="M20 10.5H10.5V20H20V10.5Z" fill="#FFB900"/>
            </svg>
            {t('auth.signInButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}