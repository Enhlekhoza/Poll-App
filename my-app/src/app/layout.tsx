import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from "sonner"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Poll App',
  description: 'Create and share polls easily',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    )
}

// src/types/index.ts
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