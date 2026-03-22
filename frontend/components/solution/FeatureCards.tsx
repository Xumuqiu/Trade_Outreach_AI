/*
Feature cards component.

Displays a grid of feature cards with icons, titles, and bullet points.
*/
"use client"

import { Mail, Search, Wand2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "AI Customer Research",
    points: ["Analyze company background", "Identify potential needs"],
    icon: Search
  },
  {
    title: "Outreach Strategy",
    points: ["Find the best conversation angle", "Generate value propositions"],
    icon: Wand2
  },
  {
    title: "Email Generation",
    points: ["Create personalized outreach emails ready to send", "Consistent tone and CTA"],
    icon: Mail
  }
]

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-2xl font-semibold text-white">A smarter workflow</h2>
      <p className="mt-2 max-w-2xl text-sm text-fox-text">
        Research, strategy, and writing—compressed into a single, fast action.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fox-input ring-1 ring-fox-border">
                  <f.icon className="h-5 w-5 text-fox-accent" />
                </div>
                <CardTitle>{f.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-fox-text">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-fox-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

