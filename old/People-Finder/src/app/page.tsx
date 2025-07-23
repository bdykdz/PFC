// src/app/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <Image
            src="/placeholder.svg"
            alt="Logo"
            width={200}
            height={120}
            priority
          />
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </header>

        <main className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Professional Profile Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Efficiently manage and search through professional profiles, contracts, and qualifications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="text-xl font-semibold">Profile Management</h3>
                <p className="text-muted-foreground">
                  Create and manage detailed professional profiles with experience, skills, and credentials
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">📄</div>
                <h3 className="text-xl font-semibold">Contract Tracking</h3>
                <p className="text-muted-foreground">
                  Track contracts, project history, and professional experience
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="text-xl font-semibold">Advanced Search</h3>
                <p className="text-muted-foreground">
                  Find the right professionals using advanced search and filtering
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}