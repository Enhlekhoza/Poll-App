import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Search indexing is disabled. Algolia has been removed from this project.'
  });
}
