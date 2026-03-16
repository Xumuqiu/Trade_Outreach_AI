/*
Pending approval emails proxy API.

This endpoint powers the Follow-up Board in the Dashboard:
- shows drafts that require human approval before sending
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.FOXREACH_BACKEND_URL
}

export async function GET() {
  const url = backendUrl()
  if (!url) return NextResponse.json([], { status: 200 })

  const res = await fetch(`${url}/emails/pending-approval`, { cache: "no-store" })
  const data = await res.json().catch(() => [])
  return NextResponse.json(data, { status: res.status })
}
