"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function Toast({
  title,
  description,
  onClose
}: {
  title?: string
  description?: string
  onClose?: () => void
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border border-fox-border bg-fox-card px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {title ? <div className="text-sm font-semibold text-white">{title}</div> : null}
          {description ? <div className="mt-1 text-sm text-fox-text">{description}</div> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-fox-muted hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  )
}

