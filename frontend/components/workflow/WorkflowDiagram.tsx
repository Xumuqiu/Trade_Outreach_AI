"use client"

import { ChevronDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  "Customer Input",
  "AI Research",
  "Customer Profiling",
  "Outreach Strategy",
  "Email Generation"
]

export function WorkflowDiagram() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-2xl font-semibold text-white">Workflow</h2>
      <p className="mt-2 max-w-2xl text-sm text-fox-text">
        A clean, vertical pipeline designed to minimize cognitive load.
      </p>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-stretch gap-3">
              {steps.map((s, idx) => (
                <div key={s} className="flex flex-col items-center">
                  <div className="w-full rounded-xl border border-fox-border bg-fox-input px-4 py-3 text-sm text-white">
                    {s}
                  </div>
                  {idx < steps.length - 1 ? (
                    <div className="my-1 flex h-8 items-center justify-center text-fox-accent">
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

