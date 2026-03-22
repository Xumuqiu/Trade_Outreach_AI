/*
前端 API Client（浏览器端调用）

约定：
- 这里的所有请求都打到 Next.js 的 /api/* 路由（同域），由这些 route.ts 转发到 FastAPI。
- 这样做可以避免 CORS，并让后端地址与密钥相关逻辑只存在于服务端环境变量中。

错误策略：
- fetch 非 2xx 时抛 Error，并尽量使用 response text 作为错误信息（便于 demo 排错）。
*/

import type {
  CustomerBackgroundResponse,
  CustomerBackgroundUpsertRequest,
  CustomerCreateRequest,
  CustomerCreateResponse,
  EmailComposeRequest,
  EmailSendNowRequest,
  PendingApprovalEmail,
  StrategyGenerateRequest,
  StrategyGenerateResponse
} from "@/types/api"

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // 统一 JSON 请求封装：默认 no-store，避免 Next.js 缓存导致数据不刷新
  const res = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed (${res.status})`)
  }

  const text = await res.text().catch(() => "")
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const apiClient = {
  createCustomer(payload: CustomerCreateRequest) {
    return requestJson<CustomerCreateResponse>("/api/customers", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },

  upsertCustomerBackground(customerId: number, payload: CustomerBackgroundUpsertRequest) {
    return requestJson<CustomerBackgroundResponse>(`/api/customers/${customerId}/background`, {
      method: "PUT",
      body: JSON.stringify(payload)
    })
  },

  generateStrategy(payload: StrategyGenerateRequest) {
    return requestJson<StrategyGenerateResponse>("/api/strategy/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },

  composeEmail(payload: EmailComposeRequest) {
    return requestJson<number>("/api/emails/compose", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },

  sendNow(payload: EmailSendNowRequest) {
    return requestJson<number>("/api/emails/send-now", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },

  listPendingApproval() {
    return requestJson<PendingApprovalEmail[]>("/api/emails/pending-approval", { method: "GET" })
  }
}
