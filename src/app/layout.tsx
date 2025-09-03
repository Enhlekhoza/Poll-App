import "./globals.css"
import { Inter as NextInter } from "next/font/google"
import ClientProviders from "./ClientProviders"

// Modified font configuration to avoid module resolution issues
const inter = NextInter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
})

export const metadata = {
  title: "Poll App",
  description: "Create and manage polls",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable}`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}