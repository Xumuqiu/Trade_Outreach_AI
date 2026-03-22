import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function PUT(req: Request, ctx: { params: { customerId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const payload = await req.json()
  const res = await fetch(`${url}/customers/${ctx.params.customerId}`, {
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

export async function DELETE(_: Request, ctx: { params: { customerId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const res = await fetch(`${url}/customers/${ctx.params.customerId}`, {
    method: "DELETE",
    cache: "no-store"
  })

  const text = await res.text()
  if (!text) return new NextResponse(null, { status: res.status })
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return new NextResponse(text, { status: res.status })
  }
}
