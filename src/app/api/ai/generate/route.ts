import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, fileText } = await req.json()
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }
    if (!prompt && !fileText) {
      return NextResponse.json({ error: 'Provide a prompt or fileText' }, { status: 400 })
    }

    const system = `You are an assistant that creates poll content. Return concise JSON with keys: title (string), description (string), options (array of 3-8 short strings). Do not include any extra keys.`
    const user = `Create poll content from the following input. If both are provided, prioritize the fileText for specifics and use the prompt for tone.
Prompt: ${prompt || ''}
FileText: ${fileText || ''}`

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
        temperature: 0.7,
      })
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'OpenAI error', details: text }, { status: 500 })
    }
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    // Try parse JSON block from the content
    let parsed: any = null
    try {
      // extract JSON from content if wrapped
      const match = content.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : JSON.parse(content)
    } catch {
      // Fallback: naive extraction
      parsed = { title: content.slice(0, 80), description: content, options: [] }
    }

    const title = String(parsed.title || '').slice(0, 200)
    const description = String(parsed.description || '').slice(0, 500)
    const options = Array.isArray(parsed.options) ? parsed.options.map((o: any) => String(o)).filter((s: string) => s.trim().length > 0).slice(0, 12) : []

    if (!title || options.length < 2) {
      return NextResponse.json({ error: 'AI did not produce enough content' }, { status: 422 })
    }

    return NextResponse.json({ title, description, options })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 })
  }
}



