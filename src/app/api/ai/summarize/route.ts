import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

type AISummaryParsed = {
  summary?: string
  nextActions?: string[]
}

function safeParseAIContent(content: string): AISummaryParsed {
  const match = content.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (typeof parsed === 'object' && parsed !== null) return parsed as AISummaryParsed
    } catch {
      // continue
    }
  }

  try {
    const parsed = JSON.parse(content)
    if (typeof parsed === 'object' && parsed !== null) return parsed as AISummaryParsed
  } catch {
    // fallback
  }

  return {}
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pollId?: string } | unknown
    const pollId =
      typeof body === 'object' && body !== null && 'pollId' in body ? (body as any).pollId : undefined

    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json({ error: 'pollId required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }

    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { options: { include: { _count: { select: { votes: true } } } } },
    })

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const summaryInput = {
      title: poll.title,
      description: poll.description,
      options: poll.options.map((o) => ({ text: o.text, votes: o._count.votes })),
    }

    const system = `You analyze poll results and output two fields: summary (2-4 sentences) and nextActions (array of 3-5 actionable suggestions). Return valid JSON.`
    const user = `Analyze this poll data: ${JSON.stringify(summaryInput)}`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.5,
      }),
    })

    if (!openaiRes.ok) {
      const text = await openaiRes.text()
      return NextResponse.json({ error: 'OpenAI error', details: text }, { status: 500 })
    }

    const openaiJson = (await openaiRes.json()) as unknown

    // Safe extraction — no @ts-expect-error needed
    const content =
      typeof openaiJson === 'object' && openaiJson !== null
        ? (openaiJson as any)?.choices?.[0]?.message?.content ?? ''
        : ''

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'OpenAI returned empty content' }, { status: 500 })
    }

    const parsed = safeParseAIContent(content)

    const summary = String(parsed.summary ?? content).slice(0, 800)
    const nextActions = Array.isArray(parsed.nextActions)
      ? parsed.nextActions.map((a) => String(a))
      : []

    return NextResponse.json({ summary, nextActions: nextActions.slice(0, 6) })
  } catch (err) {
    console.error('AI summarize error:', err)
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 })
  }
}
