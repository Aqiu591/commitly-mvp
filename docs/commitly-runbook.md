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
npm test
npm run build
```

## 当前阻塞项

- `.env.local` 目前只确认有 `OPENAI_API_KEY` 这个变量名。
- Supabase、Resend、Vercel 的真实项目配置还需要补齐。
- Git 还没有提交第一个版本。
