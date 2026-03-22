"use client"

/*
Homepage hero section.

Important behavior for demo:
- "Try Demo" clears any existing demo session and then routes to /login,
  so the user can always see the login page during a live presentation.
*/

import { useRouter } from "next/navigation"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearSession } from "@/lib/auth"

export function HeroSection() {
  const router = useRouter()

  function onTryDemo() {
    clearSession()
    router.push("/login")
  }

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-14 pt-14 md:grid-cols-2 md:items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-fox-border bg-fox-card px-3 py-1 text-xs text-fox-text">
          <Sparkles className="h-4 w-4 text-fox-accent" />
          Let AI start the conversation.
        </div>

        <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight text-white md:text-5xl">
          Let AI start the conversation
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base text-fox-text">
          TradeOutreachAI is an AI-powered system that researches potential customers and generates
          personalized outreach emails automatically.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button className="gap-2" onClick={onTryDemo}>
            Try Demo <ArrowRight className="h-4 w-4" />
          </Button>
          <a href="/architecture">
            <Button variant="secondary" className="gap-2">
              View Architecture <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="rounded-2xl border border-fox-border bg-gradient-to-b from-fox-card to-fox-bg p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">AI Output Preview</div>
            <div className="rounded-full bg-fox-accent/15 px-2 py-1 text-xs text-fox-accent">
              Live Demo
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <PreviewCard title="Company Analysis" body="Market position, expansion signals, and buying triggers." />
            <PreviewCard title="Strategy Angle" body="Best conversation entry point with a value-first approach." />
            <div className="rounded-xl border border-fox-border bg-fox-input p-4">
              <div className="text-xs font-semibold text-white">Email Draft</div>
              <div className={cn("mt-2 text-xs text-fox-text", "[font-family:var(--font-jetbrains-mono)]")}>
                Subject: Quick idea for your supply chain optimization
                <br />
                <br />
                Hi team — noticed your push into new regions. We help brands reduce lead times while...
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-fox-accent/10 blur-3xl" />
      </div>
    </section>
  )
}

function PreviewCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-fox-border bg-fox-card p-4">
      <div className="text-xs font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-fox-text">{body}</div>
    </div>
  )
}
