import { getOptionalEnvStatus } from "@/lib/config";

const setupSteps = [
  {
    step: "01",
    title: "采集",
    description: "从 AI 与金融 RSS 源抓取最近 24 到 30 小时的有效新闻，并做去重。"
  },
  {
    step: "02",
    title: "筛选",
    description: "用 OpenAI 只挑最值得读的条目，压成克制的中文摘要，不灌水。"
  },
  {
    step: "03",
    title: "排版",
    description: "生成结构化邮件，把重点、观察点和原文链接整理成一封晨报。"
  },
  {
    step: "04",
    title: "投递",
    description: "由 Resend 发送到你的邮箱，Vercel Cron 按固定时间每天自动触发。"
  }
];

const previewSections = [
  {
    label: "AI",
    headline: "芯片、模型与行业落地",
    points: [
      "AI 芯片需求与半导体财报变化",
      "模型进展与行业级应用落地",
      "值得继续追踪的下一步信号"
    ]
  },
  {
    label: "Finance",
    headline: "通胀、就业与市场情绪",
    points: [
      "宏观数据如何影响市场预期",
      "主要公司与资产价格的反应",
      "第二天开盘前最该知道的要点"
    ]
  }
];

const envRows = [
  {
    name: "OPENAI_API_KEY",
    description: "负责筛选、翻译和压缩新闻。"
  },
  {
    name: "RESEND_API_KEY",
    description: "负责把晨报投递到你的邮箱。"
  },
  {
    name: "RESEND_TO_EMAIL",
    description: "测试阶段就是你自己的收件邮箱。"
  },
  {
    name: "CRON_SECRET",
    description: "给线上 cron 接口加一层请求认证。"
  }
];

const surfaceStats = [
  {
    value: "每天 1 封",
    label: "固定节奏"
  },
  {
    value: "AI 3 条",
    label: "默认重点"
  },
  {
    value: "金融 3 条",
    label: "默认重点"
  },
  {
    value: "14:00 UTC",
    label: "当前定时"
  }
];

export default function HomePage() {
  const envStatus = getOptionalEnvStatus();
  const pipelineReady = envStatus.hasOpenAiKey && envStatus.hasResendKey && envStatus.hasRecipient;

  const statusItems = [
    {
      label: "OpenAI",
      detail: "摘要引擎",
      ready: envStatus.hasOpenAiKey
    },
    {
      label: "Resend",
      detail: "邮件投递",
      ready: envStatus.hasResendKey
    },
    {
      label: "Recipient",
      detail: "收件地址",
      ready: envStatus.hasRecipient
    },
    {
      label: "Cron",
      detail: "接口鉴权",
      ready: envStatus.hasCronSecret
    }
  ];

  return (
    <main className="page-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-kicker-row">
            <span className="eyebrow">每日晨报</span>
            <span className={`live-dot ${pipelineReady ? "ready" : "waiting"}`}>
              {pipelineReady ? "Pipeline Ready" : "Setup Incomplete"}
            </span>
          </div>

          <h1>每日晨报，把 AI 与金融世界里真正重要的事，浓缩成一封你愿意每天打开的邮件。</h1>

          <p className="hero-lead">
            它不是新闻堆砌器，而是一个为个人使用设计的邮件摘要系统。你每天只收到最重要的
            AI 与金融动态，带中文要点、观察点和原文链接。
          </p>

          <div className="surface-stats">
            {surfaceStats.map((item) => (
              <div className="surface-stat" key={item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="status-grid">
            {statusItems.map((item) => (
              <div className={`status-card ${item.ready ? "ready" : "waiting"}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.ready ? "Ready" : "Pending"}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-preview">
          <div className="mail-card">
            <div className="mail-topbar">
              <span />
              <span />
              <span />
            </div>

            <div className="mail-header">
              <p>Tomorrow, 07:00</p>
              <h2>每日晨报</h2>
              <span>重点不多，但足够你开盘前看完。</span>
            </div>

            <div className="preview-list">
              {previewSections.map((section) => (
                <article className="preview-block" key={section.label}>
                  <div className="preview-tag">{section.label}</div>
                  <h3>{section.headline}</h3>
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="section-grid">
        <article className="panel panel-warm">
          <div className="panel-heading">
            <span className="panel-kicker">Workflow</span>
            <h2>每天这一封邮件，背后其实只有 4 步。</h2>
          </div>

          <div className="step-grid">
            {setupSteps.map((item) => (
              <div className="step-card" key={item.step}>
                <span className="step-index">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-dark">
          <div className="panel-heading">
            <span className="panel-kicker">Digest Shape</span>
            <h2>它交付的不是“新闻列表”，而是一个阅读节奏。</h2>
          </div>

          <div className="reading-rhythm">
            <div className="rhythm-line">
              <strong>开头</strong>
              <p>一句总览，先告诉你今天最值得关注的核心主题。</p>
            </div>
            <div className="rhythm-line">
              <strong>AI 段</strong>
              <p>精选 3 条，解释为什么值得看，并保留原文入口。</p>
            </div>
            <div className="rhythm-line">
              <strong>金融段</strong>
              <p>精选 3 条，把宏观、公司和市场情绪压成可快速吸收的信息。</p>
            </div>
            <div className="rhythm-line">
              <strong>观察点</strong>
              <p>最后给出第二天值得继续追踪的线索，不让日报读完就断掉。</p>
            </div>
          </div>
        </article>
      </section>

      <section className="section-grid bottom-grid">
        <article className="panel">
          <div className="panel-heading">
            <span className="panel-kicker">Ops</span>
            <h2>线上如何手动触发一次</h2>
          </div>

          <p className="panel-copy">
            正式部署后，Vercel Cron 会自动请求 <code>/api/cron</code>。手动检查时，先跑一次
            dry run，再决定是否真的发信。
          </p>

          <pre>{`curl -H "Authorization: Bearer <CRON_SECRET>" \\
  "https://your-domain.vercel.app/api/cron?dryRun=1"`}</pre>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <span className="panel-kicker">Environment</span>
            <h2>真正重要的配置，其实就这几项。</h2>
          </div>

          <div className="env-list">
            {envRows.map((row) => (
              <div className="env-row" key={row.name}>
                <code>{row.name}</code>
                <p>{row.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
