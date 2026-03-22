/*
Root layout (Next.js App Router).

Responsibilities:
- Loads global CSS and fonts
- Provides global providers (e.g. toast)
- Sets base HTML/body structure for all pages
*/

import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import { Providers } from "@/app/providers"
import "@/styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
})

export const metadata: Metadata = {
  title: "TradeOutreachAI — Let AI start the conversation.",
  description:
    "TradeOutreachAI is an AI-powered system that researches potential customers and generates personalized outreach emails automatically."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans [font-family:var(--font-inter)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
