"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CustomerInsightCard({
  marketPosition,
  targetCustomers,
  productStyle,
  sustainabilityFocus
}: {
  marketPosition: string
  targetCustomers: string
  productStyle: string
  sustainabilityFocus: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Customer Insight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Market Position" value={marketPosition} />
        <Row label="Target Customers" value={targetCustomers} />
        <Row label="Product Style" value={productStyle} />
        <Row label="Sustainability Focus" value={sustainabilityFocus} />
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-white">{label}</div>
      <div className="mt-1 text-sm text-fox-text">{value || "—"}</div>
    </div>
  )
}

