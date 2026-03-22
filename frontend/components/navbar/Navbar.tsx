"use client"

/*
Top navbar (homepage + marketing pages).

Design:
- Keeps demo entry extremely simple: "Try Demo" -> /login
- Does not expose internal workflow links (Dashboard) in the marketing navbar
*/

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame } from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [{ href: "/login", label: "Try Demo" }, { href: "/architecture", label: "Architecture" }]

export function Navbar() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-40 border-b border-fox-border bg-fox-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fox-card ring-1 ring-fox-border">
            <Flame className="h-5 w-5 text-fox-accent" />
          </div>
          <div className="text-sm font-semibold text-white">TradeOutreachAI</div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm text-fox-text hover:bg-white/5 hover:text-white",
                  active && "bg-white/5 text-white ring-1 ring-fox-border"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
