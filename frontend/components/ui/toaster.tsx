"use client"

import * as React from "react"

import { Toast } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[360px] flex-col gap-2">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          onClose={() => dismiss(t.id)}
        />
      ))}
    </div>
  )
}

