import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href="/search">Go back home</Link>
      </Button>
    </div>
  )
}