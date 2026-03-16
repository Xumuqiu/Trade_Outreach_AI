"use client"

/*
Dashboard (客户管理工作台)

这个页面承载销售的主工作流：
1) Customer List：新建 / 选择 / 删除客户
2) Customer Detail：录入并保存结构化客户背景（CustomerBackground）
3) Follow-up Board：查看待审核发送的邮件草稿（pending_approval）

关键约束：
- 前端不直接调用后端地址，而是调用 Next.js 的 /api/* 代理（避免 CORS、统一错误处理）。
- AI 的输入来源必须是已保存到数据库的结构化背景，而不是前端临时表单内容。
*/

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { getSession } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import type { Customer, CustomerBackground, CustomerStatus, EmailDraft } from "@/types/dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = React.useState<string | null>(null)
  const [backendStatus, setBackendStatus] = React.useState<{
    backend_configured: boolean
    openai_configured?: boolean
    openai_model?: string
  } | null>(null)

  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null)
  const [pendingEmails, setPendingEmails] = React.useState<EmailDraft[]>([])

  const [createName, setCreateName] = React.useState("")
  const [createEmail, setCreateEmail] = React.useState("")

  const [background, setBackground] = React.useState<CustomerBackground | null>(null)
  const [loadingCustomers, setLoadingCustomers] = React.useState(false)
  const [loadingBackground, setLoadingBackground] = React.useState(false)
  const [savingBackground, setSavingBackground] = React.useState(false)
  const [backgroundSaved, setBackgroundSaved] = React.useState(false)
  const [generatingEmail, setGeneratingEmail] = React.useState(false)

  React.useEffect(() => {
    // 前端演示登录态守卫：未登录则跳转到 /login
    const session = getSession()
    if (!session) {
      router.replace("/login")
      return
    }
    setEmail(session.email)
  }, [router])

  async function refreshAll() {
    // 一键刷新：客户列表 + 待审核邮件列表
    await Promise.all([loadCustomers(), loadPendingEmails()])
  }

  async function loadCustomers() {
    // 从 /api/customers 拉取客户列表（包含后端 customer state，用于状态徽章）
    setLoadingCustomers(true)
    try {
      const res = await fetch("/api/customers", { cache: "no-store" })
      const data = (await res.json()) as Customer[]
      setCustomers(Array.isArray(data) ? data : [])
      const nextSelected =
        selectedCustomerId && data?.some((c) => c.id === selectedCustomerId)
          ? selectedCustomerId
          : data?.[0]?.id ?? null
      setSelectedCustomerId(nextSelected)
    } catch {
      setCustomers([])
      setSelectedCustomerId(null)
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function loadPendingEmails() {
    // Follow-up Board：只展示 pending_approval 的草稿（需要销售确认才能发送）
    try {
      const res = await fetch("/api/emails/pending-approval", { cache: "no-store" })
      const data = (await res.json()) as EmailDraft[]
      setPendingEmails(Array.isArray(data) ? data : [])
    } catch {
      setPendingEmails([])
    }
  }

  React.useEffect(() => {
    // 页面首次加载：刷新列表并拉取后端/LLM 配置状态用于 UI 提示
    void refreshAll()
    void fetch("/api/system/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setBackendStatus(j))
      .catch(() => setBackendStatus({ backend_configured: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // 切换客户后：加载该客户已保存的背景信息（如果没有就初始化空表单）
    if (!selectedCustomerId) {
      setBackground(null)
      setBackgroundSaved(false)
      return
    }
    setBackgroundSaved(false)
    void loadBackground(selectedCustomerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId])

  async function loadBackground(customerId: number) {
    // 背景信息是 AI 的唯一输入来源之一：必须先保存到 DB 才进入下一步
    setLoadingBackground(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/background`, { cache: "no-store" })
      const data = (await res.json()) as CustomerBackground | null
      const selected = customers.find((c) => c.id === customerId)
      if (!data || (typeof data === "object" && !("customer_id" in data))) {
        setBackground({
          customer_id: customerId,
          company_name: selected?.company ?? selected?.name ?? ""
        })
      } else {
        setBackground(data)
        setBackgroundSaved(true)
      }
    } catch {
      const selected = customers.find((c) => c.id === customerId)
      setBackground({
        customer_id: customerId,
        company_name: selected?.company ?? selected?.name ?? ""
      })
    } finally {
      setLoadingBackground(false)
    }
  }

  async function createCustomer() {
    // 新建客户（POST /api/customers）成功后自动选中该客户
    if (!createName.trim() || !createEmail.trim()) return
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), email: createEmail.trim() })
      })
      if (!res.ok) throw new Error(await res.text())
      const created = (await res.json()) as Customer
      toast({ title: "Customer created", description: `#${created.id} • ${created.name}` })
      setCreateName("")
      setCreateEmail("")
      await loadCustomers()
      setSelectedCustomerId(created.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed"
      toast({ title: "Create failed", description: msg })
    }
  }

  async function deleteCustomer(customerId: number) {
    // 删除客户（DELETE /api/customers/{id}）并刷新列表
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error(await res.text())
      toast({ title: "Customer deleted", description: `#${customerId}` })
      await loadCustomers()
      await loadPendingEmails()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      toast({ title: "Delete failed", description: msg })
    }
  }

  async function saveCustomerBackground() {
    // 保存结构化背景（PUT /api/customers/{id}/background）
    // 保存成功后，UI 会解锁下一步：Write Outreach Email
    if (!background || !selectedCustomerId) return
    if (!background.company_name?.trim()) {
      toast({ title: "Missing field", description: "Company name is required." })
      return
    }
    setSavingBackground(true)
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}/background`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(background)
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = (await res.json()) as CustomerBackground
      setBackground(saved)
      setBackgroundSaved(true)
      toast({ title: "Saved", description: "Customer background updated." })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed"
      toast({ title: "Save failed", description: msg })
    } finally {
      setSavingBackground(false)
    }
  }

  async function generateEmailAndGo() {
    // 生成草稿并跳转到邮件确认页。
    // - NEW_LEAD：走初次开发（strategy/generate -> emails/compose）
    // - 其他状态：走 follow-up（followups/generate-next，后端按状态选择 prompt）
    if (!selectedCustomerId || !backgroundSaved) return
    setGeneratingEmail(true)
    try {
      const selected = customers.find((c) => c.id === selectedCustomerId) ?? null
      const status = selected?.status ?? "NEW_LEAD"
      if (status === "REPLIED" || status === "STOPPED") {
        toast({ title: "Not eligible", description: "This customer is not eligible for outreach." })
        return
      }

      const accountsRes = await fetch("/api/emails/accounts", { cache: "no-store" })
      const accounts = (await accountsRes.json().catch(() => [])) as any[]
      let accountId: number | null = null
      const first = Array.isArray(accounts) ? accounts[0] : null
      if (first?.id) accountId = Number(first.id)

      if (!accountId) {
        const createAccountRes = await fetch("/api/emails/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salesperson_name: "FoxReach Demo",
            email_address: email ?? "demo@foxreach.ai",
            provider: "demo",
            time_zone: "UTC",
            country: "US"
          })
        })
        if (!createAccountRes.ok) throw new Error(await createAccountRes.text())
        const created = (await createAccountRes.json()) as any
        if (created?.id) accountId = Number(created.id)
      }

      if (!accountId) throw new Error("No sending account available")

      let emailId: number | null = null
      if (status === "NEW_LEAD") {
        const strategyRes = await fetch("/api/strategy/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: selectedCustomerId, language: "English" }),
          cache: "no-store"
        })
        if (!strategyRes.ok) throw new Error(await strategyRes.text())
        const strategy = (await strategyRes.json()) as any
        const firstEmail = Array.isArray(strategy?.emails) ? strategy.emails[0] : null
        if (!firstEmail?.subject || !firstEmail?.body) throw new Error("AI did not return an email draft")

        const composeRes = await fetch("/api/emails/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: selectedCustomerId,
            account_id: accountId,
            subject: String(firstEmail.subject),
            body: String(firstEmail.body)
          }),
          cache: "no-store"
        })
        if (!composeRes.ok) throw new Error(await composeRes.text())
        emailId = Number(await composeRes.json())
      } else {
        const followRes = await fetch("/api/followups/generate-next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: selectedCustomerId, account_id: accountId, language: "English" }),
          cache: "no-store"
        })
        if (!followRes.ok) throw new Error(await followRes.text())
        const drafted = (await followRes.json()) as any
        emailId = Number(drafted?.email_id)
      }

      if (!emailId) throw new Error("Email draft creation failed")

      toast({ title: "Draft generated", description: `Email #${emailId} is ready for review.` })
      router.push(`/emails/${emailId}/review`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generate failed"
      toast({ title: "Generate failed", description: msg })
    } finally {
      setGeneratingEmail(false)
    }
  }

  function statusView(status: CustomerStatus | undefined) {
    const s = status ?? "NEW_LEAD"
    if (s === "NEW_LEAD") return { label: "未发送邮件", tone: "bg-white/5 text-fox-muted border-fox-border" }
    if (s === "CONTACTED") return { label: "已发送-未打开", tone: "bg-white/5 text-white border-fox-border" }
    if (s === "EMAIL_OPENED") return { label: "已发送-已打开", tone: "bg-fox-accent/10 text-fox-accent border-fox-accent/30" }
    if (s === "REPLIED") return { label: "已发送-已回复", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" }
    if (s === "FOLLOWUP_1") return { label: "Follow-up 1", tone: "bg-white/5 text-white border-fox-border" }
    if (s === "FOLLOWUP_2") return { label: "Follow-up 2", tone: "bg-white/5 text-white border-fox-border" }
    if (s === "FOLLOWUP_3") return { label: "Follow-up 3", tone: "bg-white/5 text-white border-fox-border" }
    if (s === "STOPPED") return { label: "Stopped", tone: "bg-white/5 text-fox-muted border-fox-border" }
    return { label: s, tone: "bg-white/5 text-fox-muted border-fox-border" }
  }

  return (
    <div className="min-h-screen bg-fox-bg">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-white">Customer Dashboard</div>
                <div className="mt-1 text-sm text-fox-muted">Signed in as {email ?? "…"}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      backendStatus?.backend_configured
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-fox-border bg-white/5 text-fox-muted"
                    }`}
                  >
                    Backend {backendStatus?.backend_configured ? "connected" : "not configured"}
                  </span>
                  {backendStatus?.backend_configured ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        backendStatus?.openai_configured
                          ? "border-fox-accent/30 bg-fox-accent/10 text-fox-accent"
                          : "border-fox-border bg-white/5 text-fox-muted"
                      }`}
                    >
                      LLM {backendStatus?.openai_configured ? "enabled" : "not configured"}
                      {backendStatus?.openai_model ? ` • ${backendStatus.openai_model}` : ""}
                    </span>
                  ) : null}
                </div>
              </div>
              <Button variant="secondary" className="gap-2" onClick={refreshAll} disabled={loadingCustomers}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer List</CardTitle>
                    <CardDescription>Create, select, and delete customers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          placeholder="Customer name"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          value={createEmail}
                          onChange={(e) => setCreateEmail(e.target.value)}
                        />
                      </div>
                      <Button className="w-full gap-2" onClick={createCustomer} disabled={!createName.trim() || !createEmail.trim()}>
                        <Plus className="h-4 w-4" />
                        New Customer
                      </Button>
                    </div>

                    <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                      {loadingCustomers ? (
                        <div className="text-sm text-fox-muted">Loading…</div>
                      ) : customers.length ? (
                        customers.map((c) => {
                          const active = c.id === selectedCustomerId
                          const sv = statusView(c.status)
                          return (
                            <div
                              key={c.id}
                              className={`flex items-center justify-between gap-2 rounded-xl border border-fox-border bg-fox-input px-3 py-2 ${
                                active ? "ring-2 ring-fox-accent/25" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerId(c.id)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                                  <span
                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${sv.tone}`}
                                  >
                                    {sv.label}
                                  </span>
                                </div>
                                <div className="truncate text-xs text-fox-muted">{c.email}</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCustomer(c.id)}
                                className="rounded-lg p-2 text-fox-muted hover:bg-white/5 hover:text-white"
                                aria-label="Delete customer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-sm text-fox-muted">No customers yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="xl:col-span-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Detail</CardTitle>
                    <CardDescription>Fill customer background information for AI outreach.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedCustomerId ? (
                      <div className="text-sm text-fox-muted">Select a customer to edit background.</div>
                    ) : loadingBackground || !background ? (
                      <div className="text-sm text-fox-muted">Loading background…</div>
                    ) : (
                      <div className="space-y-6">
                        <Section title="Company Basics">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="Company Name (required)">
                              <Input
                                value={background.company_name}
                                onChange={(e) => setBackground({ ...background, company_name: e.target.value })}
                              />
                            </Field>
                            <Field label="Founded Year">
                              <Input
                                value={background.founded_year?.toString() ?? ""}
                                onChange={(e) =>
                                  setBackground({
                                    ...background,
                                    founded_year: e.target.value ? Number(e.target.value) : null
                                  })
                                }
                                placeholder="e.g. 1998"
                              />
                            </Field>
                            <Field label="Company Type">
                              <Input
                                value={background.company_type ?? ""}
                                onChange={(e) => setBackground({ ...background, company_type: e.target.value })}
                              />
                            </Field>
                            <Field label="Main Market">
                              <Input
                                value={background.main_market ?? ""}
                                onChange={(e) => setBackground({ ...background, main_market: e.target.value })}
                              />
                            </Field>
                            <Field label="Company Size (employees)">
                              <Input
                                value={background.company_size_employees ?? ""}
                                onChange={(e) =>
                                  setBackground({ ...background, company_size_employees: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="Company Size (revenue)">
                              <Input
                                value={background.company_size_revenue ?? ""}
                                onChange={(e) => setBackground({ ...background, company_size_revenue: e.target.value })}
                              />
                            </Field>
                            <Field label="Purchasing Volume">
                              <Input
                                value={background.company_size_purchasing_volume ?? ""}
                                onChange={(e) =>
                                  setBackground({
                                    ...background,
                                    company_size_purchasing_volume: e.target.value
                                  })
                                }
                              />
                            </Field>
                            <BoolField
                              label="Has Own Brand"
                              value={!!background.has_own_brand}
                              onChange={(next) => setBackground({ ...background, has_own_brand: next })}
                            />
                          </div>
                        </Section>

                        <details className="rounded-xl border border-fox-border bg-fox-card p-4">
                          <summary className="cursor-pointer text-sm font-semibold text-white">
                            Advanced Background (all fields)
                          </summary>
                          <div className="mt-4 space-y-6">
                            <Section title="Channels & Business Model">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <BoolField
                                  label="Ecommerce Seller"
                                  value={!!background.ecommerce_seller}
                                  onChange={(next) => setBackground({ ...background, ecommerce_seller: next })}
                                />
                                <BoolField
                                  label="Independent Store"
                                  value={!!background.independent_store}
                                  onChange={(next) => setBackground({ ...background, independent_store: next })}
                                />
                                <BoolField
                                  label="Offline Retail"
                                  value={!!background.offline_retail}
                                  onChange={(next) => setBackground({ ...background, offline_retail: next })}
                                />
                                <BoolField
                                  label="Corporate Gifts"
                                  value={!!background.corporate_gifts}
                                  onChange={(next) => setBackground({ ...background, corporate_gifts: next })}
                                />
                              </div>
                            </Section>

                            <Section title="Products & Requirements">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field label="Average Price Level">
                                  <Input
                                    value={background.average_price_level ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, average_price_level: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field label="Design Style">
                                  <Input
                                    value={background.design_style ?? ""}
                                    onChange={(e) => setBackground({ ...background, design_style: e.target.value })}
                                  />
                                </Field>
                                <Field label="Product Line Change Frequency">
                                  <Input
                                    value={background.product_line_change_frequency ?? ""}
                                    onChange={(e) =>
                                      setBackground({
                                        ...background,
                                        product_line_change_frequency: e.target.value
                                      })
                                    }
                                  />
                                </Field>
                                <div className="md:col-span-2">
                                  <Field label="Product Matrix Description">
                                    <Textarea
                                      value={background.product_matrix_description ?? ""}
                                      onChange={(e) =>
                                        setBackground({ ...background, product_matrix_description: e.target.value })
                                      }
                                    />
                                  </Field>
                                </div>
                                <div className="md:col-span-2">
                                  <Field label="Customization Requirement">
                                    <Textarea
                                      value={background.customization_requirement ?? ""}
                                      onChange={(e) =>
                                        setBackground({ ...background, customization_requirement: e.target.value })
                                      }
                                    />
                                  </Field>
                                </div>
                              </div>
                            </Section>

                            <Section title="Targeting & Sustainability">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field label="Target Customer Profile">
                                  <Textarea
                                    value={background.target_customer_profile ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, target_customer_profile: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field label="Sustainability Focus">
                                  <Textarea
                                    value={background.sustainability_focus ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, sustainability_focus: e.target.value })
                                    }
                                  />
                                </Field>
                                <div className="md:col-span-2">
                                  <Field label="Public Supplier Information">
                                    <Textarea
                                      value={background.public_supplier_information ?? ""}
                                      onChange={(e) =>
                                        setBackground({
                                          ...background,
                                          public_supplier_information: e.target.value
                                        })
                                      }
                                    />
                                  </Field>
                                </div>
                              </div>
                            </Section>

                            <Section title="Roles & Decision">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field label="Buyer Role">
                                  <Input
                                    value={background.buyer_role ?? ""}
                                    onChange={(e) => setBackground({ ...background, buyer_role: e.target.value })}
                                  />
                                </Field>
                                <Field label="Decision Maker Role">
                                  <Input
                                    value={background.decision_maker_role ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, decision_maker_role: e.target.value })
                                    }
                                  />
                                </Field>
                                <BoolField
                                  label="Has Product Manager"
                                  value={!!background.has_product_manager}
                                  onChange={(next) => setBackground({ ...background, has_product_manager: next })}
                                />
                                <Field label="LinkedIn Activity">
                                  <Textarea
                                    value={background.linkedin_activity ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, linkedin_activity: e.target.value })
                                    }
                                  />
                                </Field>
                              </div>
                            </Section>

                            <Section title="History & Notes">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <BoolField
                                  label="Previous Contact"
                                  value={!!background.previous_contact}
                                  onChange={(next) => setBackground({ ...background, previous_contact: next })}
                                />
                                <Field label="Last Contact Time (ISO)">
                                  <Input
                                    value={background.last_contact_time ?? ""}
                                    onChange={(e) =>
                                      setBackground({ ...background, last_contact_time: e.target.value })
                                    }
                                    placeholder="e.g. 2026-03-10T09:00:00Z"
                                  />
                                </Field>
                                <div className="md:col-span-2">
                                  <Field label="Contact Notes">
                                    <Textarea
                                      value={background.contact_notes ?? ""}
                                      onChange={(e) => setBackground({ ...background, contact_notes: e.target.value })}
                                    />
                                  </Field>
                                </div>
                                <div className="md:col-span-2">
                                  <Field label="Additional Notes">
                                    <Textarea
                                      value={background.additional_notes ?? ""}
                                      onChange={(e) =>
                                        setBackground({ ...background, additional_notes: e.target.value })
                                      }
                                    />
                                  </Field>
                                </div>
                                <div className="md:col-span-2">
                                  <Field label="Long-term Factory Relationship">
                                    <Textarea
                                      value={background.long_term_factory_relationship ?? ""}
                                      onChange={(e) =>
                                        setBackground({
                                          ...background,
                                          long_term_factory_relationship: e.target.value
                                        })
                                      }
                                    />
                                  </Field>
                                </div>
                              </div>
                            </Section>
                          </div>
                        </details>

                        <div className="flex items-center justify-end gap-2">
                          {backgroundSaved ? (
                            <Button
                              variant="secondary"
                              onClick={generateEmailAndGo}
                              disabled={generatingEmail || savingBackground}
                            >
                              {generatingEmail ? "Generating…" : "Write Outreach Email"}
                            </Button>
                          ) : null}
                          <Button
                            onClick={saveCustomerBackground}
                            disabled={savingBackground || !background.company_name.trim()}
                          >
                            {savingBackground ? "Saving…" : "Save Background"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="xl:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up Board</CardTitle>
                    <CardDescription>Emails pending approval to send today.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingEmails.length ? (
                        pendingEmails.map((e) => (
                          <div
                            key={e.id}
                            className="rounded-xl border border-fox-border bg-fox-input p-3"
                          >
                            <div className="text-xs text-fox-muted">Customer #{e.customer_id}</div>
                            <div className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                              {e.subject}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-xs text-fox-muted">{e.status}</div>
                              <button
                                type="button"
                                className="rounded-lg px-2 py-1 text-xs text-fox-accent hover:bg-white/5"
                                onClick={() => router.push(`/emails/${e.id}/review`)}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-fox-muted">No pending approvals.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-fox-muted">{label}</div>
      {children}
    </div>
  )
}

function BoolField({
  label,
  value,
  onChange
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex h-10 items-center justify-between gap-3 rounded-xl border border-fox-border bg-fox-input px-3">
      <div className="text-xs font-medium text-fox-text">{label}</div>
      <Checkbox checked={value} onCheckedChange={onChange} />
    </div>
  )
}
