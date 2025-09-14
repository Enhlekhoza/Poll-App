import "./globals.css"
import { Poppins } from "next/font/google"
import ClientProviders from "./ClientProviders"

// Configure Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-poppins",
})

export const metadata = {
  title: "Poll App",
  description: "Create and manage polls",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}