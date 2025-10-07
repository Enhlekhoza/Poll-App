import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { pollId } = await req.json()
    if (!pollId) return NextResponse.json({ error: 'pollId required' }, { status: 400 })
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }

    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { options: { include: { _count: { select: { votes: true } } } } }
    })
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

    const summaryInput = {
      title: poll.title,
      description: poll.description,
      options: poll.options.map(o => ({ text: o.text, votes: o._count.votes })),
    }

    const system = `You analyze poll results and output two fields: summary (2-4 sentences) and nextActions (array of 3-5 actionable suggestions). Return valid JSON.`
    const user = `Analyze this poll data: ${JSON.stringify(summaryInput)}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.5,
      })
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'OpenAI error', details: text }, { status: 500 })
    }
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    let parsed: any = {}
    try {
      const match = content.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : JSON.parse(content)
    } catch {}

    return NextResponse.json({
      summary: String(parsed.summary || content).slice(0, 800),
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.slice(0, 6) : [],
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 })
  }
}



