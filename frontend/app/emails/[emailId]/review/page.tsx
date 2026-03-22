"use client"

/*
邮件确认页（Email Review）

这是“AI 生成 -> 人工审核 -> 发送/定时发送”的关键闭环页面。

数据来源：
- 邮件草稿：GET /api/emails/{emailId}
- 客户信息：GET /api/customers（用于展示客户名称/行业/状态）
- 客户背景：GET /api/customers/{customerId}/background（用于洞察字段）
- AI 策略：POST /api/strategy/generate（用于 AI Strategy / Customer Insight 卡片）

发送动作：
- 发送前先 PUT /api/emails/{emailId} 保存人工编辑的 subject/body
- Send Now：POST /api/emails/{emailId}/send-now
- Schedule Send：POST /api/emails/{emailId}/schedule
*/

import * as React from "react"
import { useRouter, useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CustomerHeader } from "@/components/emails/CustomerHeader"
import { AIStrategyCard } from "@/components/emails/AIStrategyCard"
import { CustomerInsightCard } from "@/components/emails/CustomerInsightCard"
import { GeneratedEmailCard } from "@/components/emails/GeneratedEmailCard"
import type { Customer } from "@/types/dashboard"
import type { CustomerBackgroundResponse, StrategyGenerateResponse } from "@/types/api"

export default function EmailReviewPage() {
  const router = useRouter()
  const params = useParams<{ emailId: string }>()
  const { toast } = useToast()

  const emailId = params.emailId
  const [loading, setLoading] = React.useState(true)
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [scheduleHour, setScheduleHour] = React.useState(9)
  const [timeZone, setTimeZone] = React.useState<string | null>(null)
  const [country, setCountry] = React.useState<string | null>(null)

  const [customerId, setCustomerId] = React.useState<number | null>(null)
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [background, setBackground] = React.useState<CustomerBackgroundResponse | null>(null)
  const [strategy, setStrategy] = React.useState<StrategyGenerateResponse | null>(null)
  const [strategyLoading, setStrategyLoading] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      if (!emailId) {
        router.replace("/dashboard")
        return
      }
      setLoading(true)
      try {
        // 加载草稿邮件内容，并取得 customer_id 以拉取客户上下文
        const res = await fetch(`/api/emails/${emailId}`, { cache: "no-store" })
        const data = await res.json()
        const cid = Number(data?.customer_id)
        if (cid) setCustomerId(cid)
        setSubject(data?.subject ?? "")
        setBody(data?.body ?? "")
        setTimeZone(data?.time_zone ?? null)
        setCountry(data?.country ?? null)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [emailId, router])

  React.useEffect(() => {
    async function loadCustomerContext() {
      if (!customerId) return
      try {
        // 客户列表里包含当前客户状态（NEW_LEAD/CONTACTED/OPENED/REPLIED...）
        // 背景信息用于生成洞察卡片字段与更好的 AI prompt 上下文
        const [customersRes, bgRes] = await Promise.all([
          fetch("/api/customers", { cache: "no-store" }),
          fetch(`/api/customers/${customerId}/background`, { cache: "no-store" })
        ])
        const customers = (await customersRes.json().catch(() => [])) as Customer[]
        const selected = Array.isArray(customers) ? customers.find((c) => c.id === customerId) ?? null : null
        setCustomer(selected)
        setTimeZone((prev) => prev ?? selected?.time_zone ?? null)
        setCountry((prev) => prev ?? selected?.country ?? null)
        const bg = (await bgRes.json().catch(() => null)) as CustomerBackgroundResponse | null
        setBackground(bg && typeof bg === "object" ? bg : null)
      } catch {
        setCustomer(null)
        setBackground(null)
      }
    }
    void loadCustomerContext()
  }, [customerId])

  React.useEffect(() => {
    async function loadStrategy() {
      if (!customerId) return
      setStrategyLoading(true)
      try {
        // 这里会触发真实的 LLM 策略生成：如果 OPENAI_API_KEY 未配置，会返回 503
        const res = await fetch("/api/strategy/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId, language: "English" }),
          cache: "no-store"
        })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as StrategyGenerateResponse
        setStrategy(data)
      } catch {
        setStrategy(null)
      } finally {
        setStrategyLoading(false)
      }
    }
    void loadStrategy()
  }, [customerId])

  async function saveDraft() {
    if (!emailId) return
    // 人工编辑内容必须先落库，才能保证发送出去的是确认后的版本
    await fetch(`/api/emails/${emailId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, time_zone: timeZone, country })
    })
  }

  async function onSendNow() {
    if (!emailId) return
    setSending(true)
    try {
      await saveDraft()
      const res = await fetch(`/api/emails/${emailId}/send-now`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Sent", description: "Email has been sent." })
      router.push("/dashboard")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed"
      toast({ title: "Send failed", description: msg })
    } finally {
      setSending(false)
    }
  }

  async function onScheduleSend() {
    if (!emailId) return
    if (Number.isNaN(scheduleHour) || scheduleHour < 0 || scheduleHour > 23) {
      toast({ title: "Invalid time", description: "Desired local hour must be 0–23." })
      return
    }
    setSending(true)
    try {
      await saveDraft()
      const res = await fetch(`/api/emails/${emailId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desired_local_hour: scheduleHour })
      })
      if (!res.ok) throw new Error(await res.text())
      toast({
        title: "Scheduled",
        description: `Email scheduled at ${String(scheduleHour).padStart(2, "0")}:00${timeZone ? ` (${timeZone})` : ""}`
      })
      router.push("/dashboard")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Schedule failed"
      toast({ title: "Schedule failed", description: msg })
    } finally {
      setSending(false)
    }
  }

  const displayName =
    background?.company_name?.trim() ||
    customer?.company?.trim() ||
    customer?.name?.trim() ||
    `Customer #${customerId ?? ""}`

  const displayIndustry = customer?.industry?.trim() || background?.company_type?.trim() || "—"

  const purchasingBehavior = buildPurchasingBehavior(background)
  const priceRange = background?.average_price_level ?? "—"
  const decisionMaker = background?.decision_maker_role ?? "—"
  const recommendedApproach = strategy?.strategy?.goal ?? "—"
  const customerProfile = strategy?.profile?.summary ?? (strategyLoading ? "Loading…" : "—")

  const marketPosition = strategy?.profile?.positioning ?? "—"
  const targetCustomers = background?.target_customer_profile ?? "—"
  const productStyle = background?.design_style ?? "—"
  const sustainabilityFocus = background?.sustainability_focus ?? "—"

  return (
    <div className="min-h-screen bg-fox-bg">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <CustomerHeader name={displayName} industry={displayIndustry} status={customer?.status} />

        {loading ? (
          <div className="mt-6 text-sm text-fox-muted">Loading…</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <AIStrategyCard
                  customerProfile={customerProfile}
                  purchasingBehavior={purchasingBehavior}
                  priceRange={priceRange}
                  decisionMaker={decisionMaker}
                  recommendedApproach={recommendedApproach}
                />
              </div>
              <div className="lg:col-span-6">
                <CustomerInsightCard
                  marketPosition={marketPosition}
                  targetCustomers={targetCustomers}
                  productStyle={productStyle}
                  sustainabilityFocus={sustainabilityFocus}
                />
              </div>
            </div>

            <div className="mt-4">
              <GeneratedEmailCard
                subject={subject}
                onSubjectChange={setSubject}
                body={body}
                onBodyChange={setBody}
                timeZone={timeZone}
                countryLabel={country}
                scheduleHour={scheduleHour}
                onScheduleHourChange={(v) => setScheduleHour(clampHour(v))}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={onScheduleSend} disabled={sending}>
                Schedule Send
              </Button>
              <Button onClick={onSendNow} disabled={sending}>
                Send Now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function clampHour(v: number) {
  if (Number.isNaN(v)) return 9
  return Math.max(0, Math.min(23, Math.floor(v)))
}

function buildPurchasingBehavior(bg: CustomerBackgroundResponse | null) {
  if (!bg) return "—"
  const parts: string[] = []
  if (bg.has_own_brand) parts.push("Own brand")
  if (bg.ecommerce_seller) parts.push("E-commerce")
  if (bg.independent_store) parts.push("Independent stores")
  if (bg.offline_retail) parts.push("Offline retail")
  if (bg.corporate_gifts) parts.push("Corporate gifts")
  if (!parts.length) return "—"
  return parts.join(" • ")
}
