/*
Single email draft proxy API.

Routes:
- GET /api/emails/:emailId -> read a draft for the review page
- PUT /api/emails/:emailId -> persist sales edits (subject/body)
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.FOXREACH_BACKEND_URL
}

export async function GET(_: Request, ctx: { params: { emailId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })
  const res = await fetch(`${url}/emails/${ctx.params.emailId}`, { cache: "no-store" })
  const text = await res.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}

export async function PUT(req: Request, ctx: { params: { emailId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })
  const payload = await req.json()
  const res = await fetch(`${url}/emails/${ctx.params.emailId}`, {
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
