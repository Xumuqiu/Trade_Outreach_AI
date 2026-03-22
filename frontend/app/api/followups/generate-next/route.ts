/*
Follow-up draft generation proxy API.

This endpoint asks the backend to generate the next follow-up draft based on:
- current CustomerState (sent/opened/followup step)
- structured CustomerBackground

The backend chooses the correct stage-specific prompt.
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function POST(req: Request) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/followups/generate-next`, {
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
