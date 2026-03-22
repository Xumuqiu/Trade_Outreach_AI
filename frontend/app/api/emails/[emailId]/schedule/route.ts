import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function POST(req: Request, ctx: { params: { emailId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })
  const payload = await req.json()
  const res = await fetch(`${url}/emails/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email_id: Number(ctx.params.emailId),
      desired_local_hour: payload?.desired_local_hour ?? null,
      earliest_utc: payload?.earliest_utc ?? null
    }),
    cache: "no-store"
  })
  const text = await res.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}
