import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Space_Grotesk, Outfit } from "next/font/google"
import { Providers } from "@/app/providers"

// Initialize fonts
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })
const _outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Dinero Programable | Smart Contracts Blockchain",
  description: "Implementación de Dinero Programable mediante Contratos Inteligentes en Blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${_spaceGrotesk.variable} ${_outfit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
