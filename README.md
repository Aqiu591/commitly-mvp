# Commitly MVP

Commitly 是一个轻量的“客户沟通承诺追踪工具”。你可以粘贴会议纪要、邮件、聊天记录或电话摘要，系统会用 OpenAI Responses API 和严格 JSON 结构提取可能的承诺，再由人工审核确认，最后进入看板追踪。

## 技术栈

- Next.js App Router
- Supabase Auth、Postgres、RLS
- OpenAI Responses API + strict JSON schema
- Resend 邮件发送
- Vercel Cron 每日简报
- Vitest 单元测试、集成测试和 AI eval 样例

## 本地运行

1. 把 `.env.example` 里的变量名复制到 `.env.local`，补齐 Supabase、Resend、Cron 等配置。`OPENAI_API_KEY` 只放在 `.env.local`。
2. 在 Supabase 项目里执行 `supabase/migrations/001_init.sql`。
3. 执行 `npm install` 安装依赖。
4. 执行 `npm run dev`，打开 `http://localhost:3000`。

每日简报接口支持 `POST /api/reminders/daily-digest` 手动触发，也支持 `GET /api/reminders/daily-digest` 给 Vercel Cron 使用。
