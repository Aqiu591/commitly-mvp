# Commitly MVP

Commitly 是一个轻量的“客户沟通承诺追踪工具”。你可以粘贴会议纪要、邮件、聊天记录或电话摘要，系统会用 OpenAI Responses API 和严格 JSON 结构提取可能的承诺，再由人工审核确认，最后进入看板追踪。

它不是 CRM，也不会连接 Gmail、微信、Slack 或飞书账号。当前 MVP 只做一件事：把你已经拿到的沟通文本，变成可以每天查看和勾掉的承诺清单。

## 试用流程

1. 登录：用邮箱收 magic link；如果邮箱客户端预打开了一次性链接，也可以输入邮件验证码登录。
2. 导入：粘贴一段真实沟通文本，填写客户、项目和沟通时间。
3. 审核：删掉不像承诺的项，确认方向、负责人、截止日期和原文证据。
4. 看板：优先看逾期和今日到期，再处理未来跟进和待定日期。
5. 简报：配置 Resend 和 Cron 后，每天发送邮件摘要。

## 技术栈

- Next.js App Router
- Supabase Auth、Postgres、RLS
- OpenAI Responses API + strict JSON schema
- Resend 邮件发送
- Vercel Cron 每日简报
- Vitest 单元测试、集成测试和 AI eval 样例

## 本地运行

1. 执行 `npm install` 安装依赖。
2. 把 `.env.example` 里的变量名复制到 `.env.local`，补齐真实值。不要把 `.env.local` 提交到 Git。
3. 在 Supabase 项目里执行 `supabase/migrations/001_init.sql`。
4. 执行 `npm run doctor`，按提示补齐缺少的变量名。
5. 执行 `npm run dev`，打开 `http://localhost:3000`。

页面缺少 Supabase 配置时会进入 `/setup`，导入页缺少 OpenAI 配置时会显示中文提示，邮件发送失败时会提示检查 Resend 发件域名、API Key 和收件人邮箱。

为了让验证码备用登录可用，建议在 Supabase Auth 的 Magic Link 邮件模板里保留登录按钮，同时加入一行 `验证码：{{ .Token }}`。这样 QQ 邮箱或安全软件提前打开 magic link 时，用户仍可用验证码登录。

每日简报接口支持 `POST /api/reminders/daily-digest` 手动触发，也支持 `GET /api/reminders/daily-digest` 给 Vercel Cron 使用。

## 常用命令

```powershell
npm run doctor
npm run doctor:full
npm test
npm run build
npm run sync:github -- -Message "说明这次完成了什么"
```

`doctor:full` 会跑更完整的检查；同步 GitHub 前建议先跑它。
