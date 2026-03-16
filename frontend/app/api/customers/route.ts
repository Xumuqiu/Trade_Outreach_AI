/*
Customers proxy API.

Routes:
- GET  /api/customers  -> GET  {BACKEND}/customers/
- POST /api/customers  -> POST {BACKEND}/customers/
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.FOXREACH_BACKEND_URL
}

export async function GET() {
  const url = backendUrl()
  if (!url) return NextResponse.json([], { status: 200 })

  const res = await fetch(`${url}/customers/`, { cache: "no-store" })
  const data = await res.json().catch(() => [])
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: Request) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/customers/`, {
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
