"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { CustomerStatus } from "@/types/dashboard"

export function CustomerHeader({
  name,
  industry,
  status
}: {
  name: string
  industry: string
  status: CustomerStatus | undefined
}) {
  const badge = statusBadge(status)
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-white">{name}</div>
          <div className="mt-1 text-sm text-fox-muted">{industry}</div>
        </div>
        <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${badge.tone}`}>
          {badge.label}
        </div>
      </CardContent>
    </Card>
  )
}

function statusBadge(status: CustomerStatus | undefined) {
  const s = status ?? "NEW_LEAD"
  if (s === "NEW_LEAD") return { label: "未发送邮件", tone: "border-fox-border bg-white/5 text-fox-muted" }
  if (s === "CONTACTED") return { label: "已发送邮件-未打开", tone: "border-fox-border bg-white/5 text-white" }
  if (s === "EMAIL_OPENED") return { label: "已发送邮件-已打开", tone: "border-fox-accent/30 bg-fox-accent/10 text-fox-accent" }
  if (s === "REPLIED") return { label: "已发送邮件-已回复", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" }
  if (s === "FOLLOWUP_1") return { label: "Follow-up 1", tone: "border-fox-border bg-white/5 text-white" }
  if (s === "FOLLOWUP_2") return { label: "Follow-up 2", tone: "border-fox-border bg-white/5 text-white" }
  if (s === "FOLLOWUP_3") return { label: "Follow-up 3", tone: "border-fox-border bg-white/5 text-white" }
  if (s === "STOPPED") return { label: "Stopped", tone: "border-fox-border bg-white/5 text-fox-muted" }
  return { label: s, tone: "border-fox-border bg-white/5 text-fox-muted" }
}

