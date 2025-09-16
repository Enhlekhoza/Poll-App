import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          {/* Replace with your actual logo/branding */}
          <Image src="/next.svg" alt="PollMaster Logo" width={100} height={24} priority />
          <span className="font-bold text-lg">PollMaster</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
