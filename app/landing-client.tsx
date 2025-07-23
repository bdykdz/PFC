'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

export function LandingClient() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">PF</span>
            </div>
            <span className="text-2xl font-bold">{t('landing.brandName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button asChild>
              <Link href="/login">{t('landing.login')}</Link>
            </Button>
          </div>
        </header>

        <main className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              {t('landing.mainTitle')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.mainSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="text-xl font-semibold">{t('landing.profileManagementTitle')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.profileManagementDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">📄</div>
                <h3 className="text-xl font-semibold">{t('landing.contractTrackingTitle')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.contractTrackingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="text-xl font-semibold">{t('landing.advancedSearchTitle')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.advancedSearchDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}