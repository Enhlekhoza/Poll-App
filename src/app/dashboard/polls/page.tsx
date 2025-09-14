import { getUserPolls } from '@/lib/actions/poll-actions';
import PollActions from '../PollActions';
import { cookies } from 'next/headers';

export default async function PollsPage() {
  // Fix for cookie usage: await cookies() before use
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-shoqsnzdwceqnisssqqh-auth-token');

  // You can use authCookie?.value if needed for auth checks or logging

  const { polls, error } = await getUserPolls();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">All Polls</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls && polls.length > 0 ? (
          polls.map((poll) => <PollActions key={poll.id} poll={poll} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center col-span-full">
            <h2 className="text-xl font-semibold mb-2">No polls yet</h2>
            <p className="text-slate-500 mb-6">Create your first poll to get started</p>
          </div>
        )}
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}
