/*
Backend status proxy API.

Used by the Dashboard to show:
- whether the backend is reachable (TRADEOUTREACHAI_BACKEND_URL configured)
- whether the LLM is configured (OPENAI_API_KEY present on backend)
*/

import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function GET() {
  const url = backendUrl()
  if (!url) return NextResponse.json({ backend_configured: false }, { status: 200 })

  const res = await fetch(`${url}/system/status`, { cache: "no-store" })
  const text = await res.text()
  try {
    return NextResponse.json({ backend_configured: true, ...(JSON.parse(text) as object) }, { status: res.status })
  } catch {
    return NextResponse.json({ backend_configured: true, raw: text }, { status: res.status })
  }
}
