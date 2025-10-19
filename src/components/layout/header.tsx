'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBell } from './NotificationBell'

export function Header() {
  const { user, signOut } = useAuth()
  
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Polling App
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard/polls" className="text-sm font-medium hover:text-primary transition-colors">
            Polls
          </Link>
          
          {user ? (
            <>
              <NotificationBell />
              <Link href="/dashboard/polls" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/polls/create" className="text-sm font-medium hover:text-primary transition-colors">
                Create Poll
              </Link>
              {user.role === 'admin' && (
                <Link href="/dashboard/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  Admin
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}