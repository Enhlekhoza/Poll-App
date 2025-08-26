import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BarChart3, CheckCircle, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            Create & Participate in Polls
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A simple platform to create engaging polls and gather opinions with real-time results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-6 text-base gap-2">
              <Link href="/polls/create">
                <Plus size={20} />
                Create Poll
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-12 px-6 text-base gap-2">
              <Link href="/polls">
                <BarChart3 size={20} />
                View Polls
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Plus className="text-blue-600" size={24} />
              </div>
              <CardTitle>Create Polls</CardTitle>
              <CardDescription>Easy poll creation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Create custom polls with multiple options in seconds</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <CardTitle>Vote Anonymously</CardTitle>
              <CardDescription>Private voting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Participate in polls without revealing your identity</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <CardTitle>Real-time Results</CardTitle>
              <CardDescription>Instant updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Watch results update in real-time as votes come in</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}