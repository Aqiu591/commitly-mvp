# Commitly 操作手册

## 每次继续开发前

1. 确认工作目录是 `D:\PP`。
2. 不读取、不打印 `.env.local` 的密钥值。
3. 执行 `npm run doctor` 看缺什么。

## 本地联调顺序

1. Supabase：执行 `supabase/migrations/001_init.sql`，补齐 Supabase 环境变量。
2. OpenAI：确认 `.env.local` 里有 `OPENAI_API_KEY`。
3. Resend：补齐 `RESEND_API_KEY` 和 `DAILY_DIGEST_FROM`。
4. 本地完整流程：登录 -> 导入 -> AI 分析 -> 审核 -> 看板。
5. 部署前执行 `npm run doctor:full`。

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

## 当前阻塞项

- `.env.local` 目前只确认有 `OPENAI_API_KEY` 这个变量名。
- Supabase、Resend、Vercel 的真实项目配置还需要补齐。
- Git 还没有提交第一个版本。
