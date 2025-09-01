import "./globals.css"
import { Inter } from "next/font/google"
import ClientProviders from "./ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Poll App",
  description: "Create and manage polls",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}