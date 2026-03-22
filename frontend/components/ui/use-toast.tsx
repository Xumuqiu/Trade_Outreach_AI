"use client"

import * as React from "react"

type ToastItem = {
  id: string
  title?: string
  description?: string
}

type ToastContextValue = {
  toasts: ToastItem[]
  toast: (t: Omit<ToastItem, "id"> & { id?: string }) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (t: Omit<ToastItem, "id"> & { id?: string }) => {
      const id = t.id ?? crypto.randomUUID()
      const item: ToastItem = { id, title: t.title, description: t.description }
      setToasts((prev) => [...prev, item])
      window.setTimeout(() => dismiss(id), 2200)
    },
    [dismiss]
  )

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}

