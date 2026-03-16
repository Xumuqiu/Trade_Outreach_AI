import { Navbar } from "@/components/navbar/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-fox-bg">
      <Navbar />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div>
          <div className="text-3xl font-semibold text-white">System Architecture</div>
          <div className="mt-2 text-sm text-fox-text">
            A clear, production-style separation between UI, API, and AI reasoning.
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-fox-text">
              <div>1) Company input (name, industry, region)</div>
              <div>2) Company analysis (structured overview + needs)</div>
              <div>3) Customer profiling</div>
              <div>4) Outreach strategy</div>
              <div>5) Email generation (subject + body)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-fox-text">
              <div>Frontend: Next.js 14, TypeScript, Tailwind, shadcn/ui</div>
              <div>Backend: FastAPI (your system)</div>
              <div>AI Engine: Prompt Engineering + LLM Analysis</div>
              <div>Data Layer: Customer data + company knowledge base</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm text-fox-text md:grid-cols-2">
              <div className="rounded-xl border border-fox-border bg-fox-input p-4">
                <div className="text-xs font-semibold text-white">Frontend</div>
                <div className="mt-2 space-y-1">
                  <div>Next.js App Router</div>
                  <div>Tailwind + shadcn/ui</div>
                  <div>Dark dashboard UI</div>
                </div>
              </div>
              <div className="rounded-xl border border-fox-border bg-fox-input p-4">
                <div className="text-xs font-semibold text-white">Backend</div>
                <div className="mt-2 space-y-1">
                  <div>FastAPI APIs</div>
                  <div>AI generation services</div>
                  <div>Follow-up state machine</div>
                </div>
              </div>
              <div className="rounded-xl border border-fox-border bg-fox-input p-4">
                <div className="text-xs font-semibold text-white">AI Engine</div>
                <div className="mt-2 space-y-1">
                  <div>Prompt templates</div>
                  <div>Structured output</div>
                  <div>Safe fallbacks</div>
                </div>
              </div>
              <div className="rounded-xl border border-fox-border bg-fox-input p-4">
                <div className="text-xs font-semibold text-white">Data Layer</div>
                <div className="mt-2 space-y-1">
                  <div>Customer background</div>
                  <div>Company capabilities</div>
                  <div>Success cases</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

