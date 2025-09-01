import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Polling App
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/polls" className="text-sm hover:underline">
            Polls
          </Link>
          <Link href="/create-poll" className="text-sm hover:underline">
            Create
          </Link>
          <Button variant="outline" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}