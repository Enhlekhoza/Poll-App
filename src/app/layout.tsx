import "./globals.css"
import { Poppins } from "next/font/google"
import ClientProviders from "./ClientProviders"
import { AuthProvider } from "@/contexts/AuthContext"
import { Metadata } from "next"

// Configure Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "PollMaster",
  description: "Create and share polls with ease.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <ClientProviders>
          <AuthProvider>{children}</AuthProvider>
        </ClientProviders>
      </body>
    </html>
  )
}