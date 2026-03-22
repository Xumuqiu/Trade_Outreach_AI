"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function GeneratedEmailCard({
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  timeZone,
  countryLabel,
  scheduleHour,
  onScheduleHourChange
}: {
  subject: string
  onSubjectChange: (v: string) => void
  body: string
  onBodyChange: (v: string) => void
  timeZone: string | null
  countryLabel: string | null
  scheduleHour: number
  onScheduleHourChange: (v: number) => void
}) {
  const nowLabel = React.useMemo(() => {
    if (!timeZone) return null
    try {
      const fmt = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone
      })
      return fmt.format(new Date())
    } catch {
      return null
    }
  }, [timeZone])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium text-fox-muted">Email Subject</div>
          <Input value={subject} onChange={(e) => onSubjectChange(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-fox-muted">Email Body</div>
          <Textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            className="[font-family:var(--font-jetbrains-mono)] min-h-[320px]"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="mb-1 text-xs font-medium text-fox-muted">
              Schedule Hour (local){countryLabel ? ` • ${countryLabel}` : ""}{timeZone ? ` • ${timeZone}` : ""}
            </div>
            <TimeWheel hour={scheduleHour} onHourChange={onScheduleHourChange} />
          </div>
          <div className="md:col-span-2 flex items-end">
            <div className="text-xs text-fox-muted">
              {nowLabel ? `Current time there: ${nowLabel}. ` : ""}
              Schedule uses the customer&apos;s local hour and stored time zone.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeWheel({ hour, onHourChange }: { hour: number; onHourChange: (v: number) => void }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const itemHeight = 36

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = Math.max(0, hour) * itemHeight
  }, [hour])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let t: number | null = null
    const onScroll = () => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => {
        const next = Math.min(23, Math.max(0, Math.round(el.scrollTop / itemHeight)))
        onHourChange(next)
        el.scrollTo({ top: next * itemHeight, behavior: "smooth" })
      }, 80)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      if (t) window.clearTimeout(t)
      el.removeEventListener("scroll", onScroll)
    }
  }, [onHourChange])

  return (
    <div className="relative w-full max-w-[160px] rounded-xl border border-fox-border bg-fox-input">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-9 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5" />
      <div
        ref={containerRef}
        className="h-[180px] overflow-y-scroll py-[72px] [scroll-snap-type:y_mandatory]"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex h-9 cursor-pointer items-center justify-center text-sm text-fox-text [scroll-snap-align:center] hover:bg-white/5"
            onClick={() => onHourChange(i)}
          >
            {String(i).padStart(2, "0")}:00
          </div>
        ))}
      </div>
    </div>
  )
}
