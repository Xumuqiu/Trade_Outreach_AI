/*
Homepage (marketing + demo entry).

Key flow:
- "Try Demo" always goes to /login (demo auth)
- After login, the user lands on /dashboard (the real workflow)
*/

import Link from "next/link"

import { HeroSection } from "@/components/hero/HeroSection"
import { Navbar } from "@/components/navbar/Navbar"
import { ProblemSection } from "@/components/problem/ProblemSection"
import { FeatureCards } from "@/components/solution/FeatureCards"
import { WorkflowDiagram } from "@/components/workflow/WorkflowDiagram"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-fox-bg">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeatureCards />
      <WorkflowDiagram />
      <DemoPreview />
      <Footer />
    </div>
  )
}

function DemoPreview() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Demo Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-sm text-fox-text">
              See how FoxReach turns company context into a ready-to-send outreach email in seconds.
            </div>
            <div className="mt-2 text-xs text-fox-muted">
              Built for clean UX: one action, clear outputs, minimal noise.
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button>Try Demo</Button>
            </Link>
            <Link href="/architecture">
              <Button variant="secondary">View Architecture</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-fox-border bg-fox-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-fox-muted">© {new Date().getFullYear()} FoxReach</div>
        <div className="text-xs text-fox-muted">Let AI start the conversation.</div>
      </div>
    </footer>
  )
}
