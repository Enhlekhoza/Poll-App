import { PollForm } from '@/components/polls/poll-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreatePollPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
          <CardDescription>Create a new polling question with multiple options</CardDescription>
        </CardHeader>
        <CardContent>
          <PollForm />
        </CardContent>
      </Card>
    </div>
  )
}