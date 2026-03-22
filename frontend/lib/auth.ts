/*
前端演示登录态（Demo Auth）

这是一个“纯前端”的 session 模拟：
- 不做真实认证，不下发 cookie
- 用 localStorage 存一个最小 session（当前只保存 email）

用途：
- 控制 /login 和 /dashboard 的跳转逻辑
- 便于演示：从首页 Try Demo 可以清理 session 后进入登录页
*/

export type AuthSession = {
  email: string
}

const STORAGE_KEY = "tradeoutreachai:session"

export function setSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}
