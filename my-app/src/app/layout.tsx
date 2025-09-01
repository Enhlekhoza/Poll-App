import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { ClientOnly } from "@/components/ClientOnly"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Poll App",
  description: "Create and share polls with QR codes",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Only render client-dependent components after hydration */}
        <ClientOnly>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  )
}