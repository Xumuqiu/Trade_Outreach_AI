import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function GET() {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const res = await fetch(`${url}/system/countries`, { cache: "no-store" })
  const text = await res.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}

