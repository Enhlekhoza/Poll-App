"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LandingPageButtons() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button onClick={handleGetStarted} size="lg" className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
        <Plus size={20} /> Get Started
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300">
        <Link href="/auth/login">
          <ArrowRight size={20} /> Login
        </Link>
      </Button>
    </div>
  )
}
