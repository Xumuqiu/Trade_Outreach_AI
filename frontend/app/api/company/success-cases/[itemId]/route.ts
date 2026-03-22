import { NextResponse } from "next/server"

function backendUrl() {
  return process.env.TRADEOUTREACHAI_BACKEND_URL
}

export async function DELETE(_: Request, ctx: { params: { itemId: string } }) {
  const url = backendUrl()
  if (!url) return NextResponse.json({ detail: "Backend not configured" }, { status: 500 })

  const res = await fetch(`${url}/company/success-cases/${ctx.params.itemId}`, {
    method: "DELETE",
    cache: "no-store"
  })
  return new NextResponse(null, { status: res.status })
}
