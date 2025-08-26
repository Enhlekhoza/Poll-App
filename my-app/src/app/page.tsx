import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Polling App</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Create and participate in polls with ease
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/create-poll">Create Poll</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/polls">View Polls</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Polls</CardTitle>
            <CardDescription>Easy poll creation</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create custom polls with multiple options</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vote Anonymously</CardTitle>
            <CardDescription>Private voting</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Participate in polls without revealing identity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Results</CardTitle>
            <CardDescription>Instant updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p>See results update in real-time as votes come in</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}