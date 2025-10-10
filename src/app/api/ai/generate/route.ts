import { NextRequest, NextResponse } from 'next/server'

type AIParsed = {
  title?: string
  description?: string
  options?: string[]
}

function safeParseAIContent(content: string): AIParsed {
  // Try to extract JSON block first, then fallback to parsing entire content.
  const match = content.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (typeof parsed === 'object' && parsed !== null) return parsed as AIParsed
    } catch {
      // fallthrough to other attempts
    }
  }

  try {
    const parsed = JSON.parse(content)
    if (typeof parsed === 'object' && parsed !== null) return parsed as AIParsed
  } catch {
    // fallback to a minimal parsed object
  }

  return {}
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { prompt?: string; fileText?: string } | unknown
    const prompt = typeof body === 'object' && body !== null && 'prompt' in body ? (body as any).prompt : undefined
    const fileText = typeof body === 'object' && body !== null && 'fileText' in body ? (body as any).fileText : undefined

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }

    if (!prompt && !fileText) {
      return NextResponse.json({ error: 'Provide a prompt or fileText' }, { status: 400 })
    }

    const system = `You are an assistant that creates poll content. Return concise JSON with keys: title (string), description (string), options (array of 3-8 short strings). Do not include extra keys.`
    const user = `Create poll content from the following input. Prioritize fileText if provided, else use prompt for tone.
Prompt: ${prompt ?? ''}
FileText: ${fileText ?? ''}`

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
        temperature: 0.7,
      }),
    })

    if (!openaiRes.ok) {
      const text = await openaiRes.text()
      return NextResponse.json({ error: 'OpenAI error', details: text }, { status: 500 })
    }

    const openaiJson = (await openaiRes.json()) as unknown
    // safe extraction
   const content =
  (openaiJson as any)?.choices?.[0]?.message?.content ?? ''

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'OpenAI returned empty content' }, { status: 500 })
    }

    const parsed = safeParseAIContent(content)

    const title = String(parsed.title ?? '').trim().slice(0, 200)
    const description = String(parsed.description ?? '').trim().slice(0, 500)
    const options =
      Array.isArray(parsed.options) && parsed.options.length > 0
        ? parsed.options.map((o) => String(o ?? '').trim()).filter((s) => s.length > 0).slice(0, 12)
        : []

    if (!title || options.length < 2) {
      return NextResponse.json({ error: 'AI did not produce enough content' }, { status: 422 })
    }

    return NextResponse.json({ title, description, options })
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 })
  }
}
