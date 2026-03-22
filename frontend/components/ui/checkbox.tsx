"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  className
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border border-fox-border bg-fox-input text-xs text-white transition-colors hover:bg-white/5 disabled:opacity-50",
        checked && "border-fox-accent/60 ring-2 ring-fox-accent/25",
        className
      )}
    >
      {checked ? "✓" : ""}
    </button>
  )
}
