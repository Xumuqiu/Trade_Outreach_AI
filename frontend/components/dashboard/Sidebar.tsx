"use client"

/*
Dashboard sidebar.

Responsibilities:
- Provides navigation within the logged-in workflow area
- Shows the TradeOutreachAI brand (clickable -> homepage)
- Provides Logout action (clears demo session)
*/

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Flame, LayoutDashboard, MailCheck, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearSession } from "@/lib/auth"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/architecture", label: "Architecture", icon: MailCheck }
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function logout() {
    clearSession()
    router.push("/login")
  }

  return (
    <aside className="sticky top-0 h-screen w-[260px] border-r border-fox-border bg-fox-bg/80 backdrop-blur">
      <Link
        href="/"
        className="flex h-16 cursor-pointer items-center gap-2 px-5 transition-colors hover:bg-white/5"
        aria-label="Go to homepage"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fox-card ring-1 ring-fox-border">
          <Flame className="h-5 w-5 text-fox-accent" />
        </div>
        <div className="text-sm font-semibold text-white">TradeOutreachAI</div>
      </Link>

      <div className="px-3">
        <nav className="space-y-1">
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fox-text hover:bg-white/5 hover:text-white",
                  active && "bg-white/5 text-white ring-1 ring-fox-border"
                )}
              >
                <it.icon className="h-4 w-4 text-fox-muted" />
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <Button variant="secondary" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
