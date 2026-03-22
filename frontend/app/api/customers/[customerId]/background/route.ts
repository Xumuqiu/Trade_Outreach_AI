/*
Customer background proxy API.

Routes:
- GET /api/customers/:id/background -> GET {BACKEND}/customers/:id/background
- PUT /api/customers/:id/background -> PUT {BACKEND}/customers/:id/background

This is the structured background that the LLM must rely on.
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function GET(_: Request, ctx: { params: { customerId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json(null, { status: 200 })

  const res = await fetch(`${url}/customers/${ctx.params.customerId}/background`, { cache: "no-store" })
  const text = await res.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}

export async function PUT(req: Request, ctx: { params: { customerId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/customers/${ctx.params.customerId}/background`, {
    method: "PUT",
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
