import { getOptionalEnvStatus } from "@/lib/config";

const setupSteps = [
  "在 Resend 创建账号，并先用 resend.dev 只给你自己的注册邮箱发测试邮件。",
  "准备 OpenAI API key，用于把英文新闻压缩成中文晨报。",
  "在 Vercel 部署项目，填入环境变量。",
  "Vercel Cron 每天触发 /api/cron，自动发送邮件。"
];

const envRows = [
  {
    name: "OPENAI_API_KEY",
    description: "OpenAI API key，用于新闻筛选、翻译和摘要。"
  },
  {
    name: "RESEND_API_KEY",
    description: "Resend API key，用于发送邮件。"
  },
  {
    name: "RESEND_TO_EMAIL",
    description: "收件邮箱。用 resend.dev 测试时，必须是你的 Resend 账号邮箱。"
  },
  {
    name: "RESEND_FROM_EMAIL",
    description: "发件地址。测试阶段可用 onboarding@resend.dev。"
  },
  {
    name: "CRON_SECRET",
    description: "给 Vercel Cron 路由加一层认证。"
  }
];

export default function HomePage() {
  const envStatus = getOptionalEnvStatus();

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="eyebrow">Vercel MVP</div>
        <h1>每天把最重要的 AI 和金融新闻，整理成中文并发到你的邮箱</h1>
        <p className="hero-copy">
          这是一个面向个人使用的云端晨报 MVP。它会从 RSS 拉取最近新闻，交给 OpenAI
          总结成中文要点，再通过 Resend 发邮件。
        </p>

        <div className="status-grid">
          <div className={`status-pill ${envStatus.hasOpenAiKey ? "ready" : "missing"}`}>
            OpenAI Key {envStatus.hasOpenAiKey ? "Ready" : "Missing"}
          </div>
          <div className={`status-pill ${envStatus.hasResendKey ? "ready" : "missing"}`}>
            Resend Key {envStatus.hasResendKey ? "Ready" : "Missing"}
          </div>
          <div className={`status-pill ${envStatus.hasRecipient ? "ready" : "missing"}`}>
            Recipient {envStatus.hasRecipient ? "Ready" : "Missing"}
          </div>
          <div className={`status-pill ${envStatus.hasCronSecret ? "ready" : "missing"}`}>
            Cron Secret {envStatus.hasCronSecret ? "Ready" : "Optional"}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>运行方式</h2>
          <ol>
            {setupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="note">
            默认定时任务写在 <code>vercel.json</code>，当前是每天 <code>14:00 UTC</code>
            触发一次。你后面可以改成自己想要的时间。
          </p>
        </article>

        <article className="panel">
          <h2>关键环境变量</h2>
          <div className="env-list">
            {envRows.map((row) => (
              <div className="env-row" key={row.name}>
                <code>{row.name}</code>
                <p>{row.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel full">
          <h2>手动测试</h2>
          <p>
            本地开发时可以直接请求 <code>/api/cron?dryRun=1</code> 查看本次摘要结果；正式部署后
            Vercel Cron 会请求同一路由并发送邮件。
          </p>
          <pre>{`curl "http://localhost:3000/api/cron?dryRun=1"`}</pre>
        </article>
      </section>
    </main>
  );
}
