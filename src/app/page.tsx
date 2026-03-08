import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { LoginPanel } from '@/components/auth/login-panel'

const loginFeatures = [
  'Google / GitHub OAuth 登录',
  'Better Auth + Hono API 网关',
  '支持扩展注册、找回密码、MFA',
]

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#fff8ec_0%,#f6f9ff_45%,#eef8f6_100%)]">
      <div className="pointer-events-none absolute -left-28 -top-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-14 md:px-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Sparkles className="size-3.5" />
            AI Hot Trend 用户中心
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 md:text-5xl">
              统一登录入口，
              <br />
              快速进入你的热点工作台
            </h1>
            <p className="max-w-xl text-pretty text-base leading-7 text-slate-600 md:text-lg">
              我们已完成 shadcn/ui 与 Tailwind CSS 集成，并使用 Better Auth 提供安全、可扩展的社交登录能力。
            </p>
          </div>

          <div className="space-y-3">
            {loginFeatures.map(feature => (
              <div key={feature} className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            <ShieldCheck className="size-4 text-sky-600" />
            OAuth 回调与会话均通过 `/api/auth/*` 统一处理
          </div>
        </section>

        <section>
          <LoginPanel />
        </section>
      </main>
    </div>
  )
}
