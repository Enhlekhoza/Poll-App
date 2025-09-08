import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BarChart3, CheckCircle, ArrowRight, Sparkles, Zap, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            Create Amazing Polls Instantly
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Engage Your Audience
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create interactive polls, gather opinions, and see real-time results. Perfect for events, surveys, and community engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/dashboard/create">
                <Plus size={20} /> Create Poll
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-12 px-8 text-base gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300">
              <Link href="/dashboard/polls">
                <BarChart3 size={20} /> View Polls <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <Plus className="text-white" size={28} />
              </div>
              <CardTitle className="text-gray-800 text-xl">Create Polls</CardTitle>
              <CardDescription className="text-gray-600">Easy poll creation with multiple options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Build engaging polls in seconds with our intuitive interface</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="text-white" size={28} />
              </div>
              <CardTitle className="text-gray-800 text-xl">Vote Anonymously</CardTitle>
              <CardDescription className="text-gray-600">Private and secure voting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Participate without revealing your identity</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:-translate-y-1">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <BarChart3 className="text-white" size={28} />
              </div>
              <CardTitle className="text-gray-800 text-xl">Real-time Results</CardTitle>
              <CardDescription className="text-gray-600">Live updates and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Watch results update instantly as votes come in</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-indigo-600 mb-2">10K+</div>
              <div className="text-gray-600">Polls Created</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-gray-600">Votes Cast</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">1K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
