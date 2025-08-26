import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    }
)

export interface Database {
    public: {
        Tables: {
            polls: {
                Row: {
                    id: string
                    created_at: string
                    title: string
                    description: string | null
                    user_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    title: string
                    description?: string | null
                    user_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    title?: string
                    description?: string | null
                    user_id?: string
                }
            }
            poll_options: {
                Row: {
                    id: string
                    poll_id: string
                    text: string
                    votes: number
                }
                Insert: {
                    id?: string
                    poll_id: string
                    text: string
                    votes?: number
                }
                Update: {
                    id?: string
                    poll_id?: string
                    text?: string
                    votes?: number
                }
            }
        }
    }
}