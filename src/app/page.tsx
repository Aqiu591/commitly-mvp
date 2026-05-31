import { BarChart3, BellRing, FileText, Sparkles, Zap } from "lucide-react";
import { Suspense } from "react";

import { LandingAutoLogin } from "@/components/landing-auto-login";
import { LandingCTA } from "@/components/landing-cta";

export default function HomePage() {
  return (
    <main className="landing-page">
      <Suspense fallback={null}>
        <LandingAutoLogin />
      </Suspense>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} />
            不连 CRM，不接通讯工具
          </div>
          <h1 className="landing-hero-title">
            承诺不落空，<br />
            <span className="landing-hero-highlight">关系不跑偏</span>
          </h1>
          <p className="landing-hero-sub">
            把散落在会议纪要、邮件、聊天记录里的每一句"我来""你负责""周五前"，变成一条条清清楚楚的承诺，按紧急程度排好，到期自动提醒。
          </p>
          <LandingCTA />
        </div>

        {/* Visual demo card */}
        <div className="landing-demo-card" aria-hidden="true">
          <div className="landing-demo-header">
            <span className="landing-demo-dot" />
            <span>今日工作台</span>
          </div>
          <div className="landing-demo-metrics">
            <div className="landing-demo-ring">68%</div>
            <div><strong>12</strong><small>待处理</small></div>
            <div className="urgent"><strong>3</strong><small>逾期</small></div>
            <div><strong>4</strong><small>无日期</small></div>
          </div>
          <div className="landing-demo-columns">
            {["今日到期", "已逾期", "我欠别人", "别人欠我"].map((label) => (
              <div className="landing-demo-col" key={label}>
                <div className="landing-demo-col-head">
                  <span>{label}</span>
                  <span className="landing-demo-count">{label === "已逾期" ? 3 : label === "今日到期" ? 2 : 4}</span>
                </div>
                <div className="landing-demo-items">
                  {Array.from({ length: label === "已逾期" ? 2 : 1 }).map((_, i) => (
                    <div className="landing-demo-item" key={i}>
                      <div className="landing-demo-item-pill" />
                      <div className="landing-demo-item-lines">
                        <span>提交 Q2 续约方案</span>
                        <small>{label === "已逾期" ? "已逾期 2 天" : "5月28日"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2>三步，把聊天记录变成行动看板</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon import-icon">
              <FileText size={20} />
            </div>
            <h3>粘贴文本</h3>
            <p>会议纪要、邮件、微信截图……任何中文沟通文本，粘贴进来就好。不连外部账号，只处理你给的内容。</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon extract-icon">
              <Zap size={20} />
            </div>
            <h3>自动提取</h3>
            <p>自动识别"我该做"和"对方该做"的事项，标注方向、负责人、截止日期。你审核确认，最终决定权在你手里。</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon track-icon">
              <BarChart3 size={20} />
            </div>
            <h3>分组追踪</h3>
            <p>按"今日到期 / 已逾期 / 我欠别人 / 别人欠我"自动分组。每天打开看板，该催什么、该做什么，一眼看清。</p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta">
        <BellRing size={24} />
        <h2>别让承诺烂在聊天记录里</h2>
        <p>每天花 2 分钟，把说过的"我来"变成做完的"搞定"。</p>
        <LandingCTA />
      </section>

      <footer className="landing-footer">
        <span>Commitly</span>
        <small>承诺追踪 · 仅此而已</small>
      </footer>
    </main>
  );
}
