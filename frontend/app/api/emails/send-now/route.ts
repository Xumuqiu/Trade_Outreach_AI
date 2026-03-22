/*
Send-now proxy API.

Used by the email review page to send an approved draft immediately.
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function POST(req: Request) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/emails/send-now`, {
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
