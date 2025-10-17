import { NextRequest, NextResponse } from 'next/server';
import algoliasearch from 'algoliasearch';
import { db } from '@/lib/prisma';

const client = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_KEY!);
const index = client.initIndex('polls');

export async function POST(req: NextRequest) {
  try {
    const polls = await db.poll.findMany({
      include: {
        options: true,
      },
    });

    const records = polls.map(poll => ({
      objectID: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options.map(o => o.text),
    }));

    await index.saveObjects(records);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
