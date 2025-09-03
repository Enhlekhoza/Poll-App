import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session && req.nextUrl.pathname.startsWith('/polls')) {
        // Create a redirect URL with the full pathname including search params
        const redirectUrl = new URL('/auth/login', req.url)
        
        // Use the full URL path with query parameters for the redirect
        const fullPath = req.nextUrl.pathname + req.nextUrl.search
        redirectUrl.searchParams.set('redirect', fullPath)
        
        // Use 307 temporary redirect to ensure method and body are preserved
        return NextResponse.redirect(redirectUrl, 307)
    }

    return res
}

export const config = {
    matcher: ['/polls/:path*'],
}

// filepath: c:\Users\dzimb\Documents\Projects\Poll-App\my-app\src\types\index.ts
export interface Poll {
    id: string
    title: string
    description?: string
    options: PollOption[]
    created_at: string
    user_id: string
}

export interface PollOption {
    id: string
    text: string
    votes: number
}

export interface User {
    id: string
    email: string
    username: string
}