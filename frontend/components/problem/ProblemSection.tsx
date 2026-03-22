"use client"

import { Clock, MessageSquareX, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const problems = [
  {
    title: "Hours researching prospects",
    description: "Manual browsing, scattered notes, and inconsistent qualification signals.",
    icon: Clock
  },
  {
    title: "Low reply rates",
    description: "Generic templates and weak personalization get ignored by busy buyers.",
    icon: MessageSquareX
  },
  {
    title: "Hard to find the right angle",
    description: "Without context, you can't lead with value or ask the right question.",
    icon: Target
  }
]

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-2xl font-semibold text-white">Cold outreach is broken</h2>
      <p className="mt-2 max-w-2xl text-sm text-fox-text">
        Most teams lose time and momentum before the first reply. TradeOutreachAI fixes the fundamentals.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {problems.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fox-input ring-1 ring-fox-border">
                  <p.icon className="h-5 w-5 text-fox-accent" />
                </div>
                <CardTitle>{p.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-fox-text">{p.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
