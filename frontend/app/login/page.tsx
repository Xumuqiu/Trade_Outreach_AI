"use client"

/*
Login page (demo auth).

This is intentionally NOT real authentication.
- The user enters email/password (or uses demo autofill)
- We store a minimal session in localStorage
- Then redirect to /dashboard
*/

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Flame, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { setSession, getSession } from "@/lib/auth"

const demoCredentials = {
  email: "ziggyxmq@qq.com",
  password: "20010926"
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const session = getSession()
    if (session) router.replace("/dashboard")
  }, [router])

  function fillDemo() {
    setEmail(demoCredentials.email)
    setPassword(demoCredentials.password)
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setSubmitting(true)
    try {
      setError(null)
      if (email.trim().toLowerCase() !== demoCredentials.email.toLowerCase() || password.trim() !== demoCredentials.password) {
        setError("Invalid demo credentials.")
        return
      }
      setSession({ email: email.trim() })
      router.push("/dashboard")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-fox-bg">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fox-card ring-1 ring-fox-border">
              <Flame className="h-5 w-5 text-fox-accent" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">TradeOutreachAI</div>
              <div className="text-xs text-fox-muted">Let AI start the conversation.</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Login</CardTitle>
              <CardDescription>Demo only. No real authentication required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onLogin}>
                <div>
                  <div className="mb-1 text-xs font-medium text-fox-muted">Email</div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-fox-muted">Password</div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                {error ? <div className="text-xs text-red-300">{error}</div> : null}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="inline-flex items-center gap-2 rounded-xl border border-fox-border bg-fox-input px-3 py-2 text-xs text-fox-text hover:bg-white/5 hover:text-white"
                    disabled={submitting}
                  >
                    <Wand2 className="h-4 w-4 text-fox-accent" />
                    Use Demo
                  </button>

                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={submitting || !email.trim() || !password.trim()}
                  >
                    Login <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 text-xs text-fox-muted">
            After login, you’ll be redirected to the dashboard.
          </div>
        </div>
      </div>
    </div>
  )
}
