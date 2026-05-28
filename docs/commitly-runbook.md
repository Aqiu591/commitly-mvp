# Commitly 操作手册

## 每次继续开发前

1. 确认工作目录是 `D:\PP`。
2. 不读取、不打印 `.env.local` 的密钥值。
3. 执行 `npm run doctor` 看缺什么。

## 本地联调顺序

1. Supabase：执行 `supabase/migrations/001_init.sql`，补齐 Supabase 环境变量。
2. Supabase Auth URL 配置：在 Redirect URLs 中加入 `http://localhost:3000/auth/callback` 和 `http://127.0.0.1:3000/auth/callback`；本地试用时固定使用其中一个地址发起登录。
3. Supabase Auth 邮件模板：默认保留 `{{ .ConfirmationURL }}`；如果使用 SSR token hash 模板，按钮指向 `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard`。
4. 验证码登录：当前 MVP 默认隐藏验证码入口。只有邮件模板已经加入 `验证码：{{ .Token }}`，并重新启用 UI 后，才把它作为 magic link 被预打开时的备用流程。
5. OpenAI：确认 `.env.local` 里有 `OPENAI_API_KEY`，导入页才能分析文本。
6. Resend：补齐 `RESEND_API_KEY` 和 `DAILY_DIGEST_FROM`，每日简报才能发送。
7. Cron：补齐 `CRON_SECRET`，本地手动触发和 Vercel Cron 都要带 Bearer token。
8. 本地完整流程：登录 -> 导入 -> AI 分析 -> 审核 -> 看板。
9. 部署前执行 `npm run doctor:full`。

## 普通试用者怎么走

1. 先打开 `/setup`，只看哪些变量名缺失，不会看到密钥值。
2. 配好 Supabase 后去 `/login`，输入邮箱收登录链接。
3. 去 `/import` 粘贴一段沟通文本。这里不会自动连接 Gmail、微信、Slack 或飞书。
4. 进入 `/review/...` 后，按“删除误提 -> 改方向/责任人/日期 -> 保存到看板”的顺序审核。
5. 在 `/dashboard` 每天先处理“已逾期”和“今日到期”，再处理未来跟进。

## 常见提示怎么处理

- `缺少 OPENAI_API_KEY`：补齐 OpenAI 配置，重启本地服务，再重新导入。
- `请先登录`：登录态过期，回到 `/login` 重新收 magic link。
- `登录的一次性链接已失效或已经用过`：重新发送登录邮件，只使用最新一封；如果邮箱客户端会预打开链接，复制完整链接到当前浏览器地址栏。
- `登录链接不完整，可能没有回到 /auth/callback`：检查 Supabase Auth 的 Redirect URLs 是否包含当前本地地址，尤其是 `localhost` 和 `127.0.0.1` 是否混用。
- `验证码已失效或不正确`：只有在邮件模板已经加入 `{{ .Token }}` 且 UI 已重新启用验证码入口时才会出现；重新发送登录邮件，并输入最新一封里的验证码。
- `AI 分析超时`：先缩短原文，或稍后重试。
- `每日简报发送失败`：检查 Resend 发件域名是否验证、API Key 是否有效、收件邮箱是否存在。
- `缺少 CRON_SECRET`：补齐 Cron 配置后再触发每日简报接口。

## 常用命令

```powershell
npm run dev
npm run doctor
npm run doctor:full
npm run sync:github -- -Message "说明这次完成了什么"
npm test
npm run build
```

## 每次完成进度后同步 GitHub

1. 先运行 `npm run doctor`，确认代码健康。
2. 再运行 `npm run sync:github -- -Message "本次进度说明"`。
3. 如果是部署前或大改动，运行 `npm run sync:github -- -Full -Message "本次进度说明"`。
4. 脚本会自动阻止 `.env.local`、`.next`、`node_modules`、`*.tsbuildinfo` 进入提交。

## 后续对话框

后续工作按 `docs/commitly-workstreams.md` 分成 5 个对话框推进：Supabase、OpenAI eval、Resend、Vercel、试用版打磨。
