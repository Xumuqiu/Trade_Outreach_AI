"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AIStrategyCard({
  customerProfile,
  purchasingBehavior,
  priceRange,
  decisionMaker,
  recommendedApproach
}: {
  customerProfile: string
  purchasingBehavior: string
  priceRange: string
  decisionMaker: string
  recommendedApproach: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Strategy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Customer Profile" value={customerProfile} />
        <Row label="Purchasing Behavior" value={purchasingBehavior} />
        <Row label="Price Range" value={priceRange} />
        <Row label="Decision Maker" value={decisionMaker} />
        <Row label="Recommended Approach" value={recommendedApproach} />
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

