/*
Next.js API Route (proxy) -> FastAPI

Why this exists:
- Keeps the browser calling same-origin /api/* endpoints (avoids CORS).
- The real backend URL is injected via FOXREACH_BACKEND_URL (server-side env).
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.FOXREACH_BACKEND_URL
}

export async function POST(req: Request) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/strategy/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const text = await res.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}
