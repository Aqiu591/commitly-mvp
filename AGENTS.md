# Commitly MVP

粘贴聊天文本 → AI 提取承诺 → 审核 → 看板追踪。Next.js 15 + Supabase + OpenAI。

## 关键约束
- 工作目录：`D:\PP`
- **绝不读取或打印 `.env.local` 的密钥值**
- 每次改代码前先跑 `npm run doctor`
- 每次完成进度后跑 `npm run sync:github -- -Message "..."` 同步到 GitHub

## 命令
- `npm run dev` — 启动本地服务
- `npm test` — 跑全部测试（55 个）
- `npm run build` — 构建
- `npm run doctor` — 检查环境变量和配置是否齐全
- `npm run doctor:full` — 部署前完整检查
- `npm run sync:github -- -Message "..."` — 提交并推送
- `npm run lint` / `npm run typecheck` — 类型检查

## Gotchas
- Supabase Auth：本地调试时 localhost 和 127.0.0.1 不能混用，Redirect URLs 里两个都要配
- 登录链接失效 → 重新发送，只用最新一封
- AI 分析超时 → 先缩短原文，或稍后重试
- `.env.local`、`.next`、`node_modules`、`*.tsbuildinfo` 会被 sync:github 脚本自动排除，不要手动加到 git

## 架构约定
- 承诺方向：`i_owe` = 己方欠客户，`they_owe` = 客户欠己方
- AI 提取走 strict JSON Schema（`src/lib/ai/commitment-schema.ts`）
- RLS 策略确保用户只能访问自己的数据
- 导入页已重定向到 `/new`

## 参考
- @docs/commitly-runbook.md — 完整操作手册
- @docs/commitly-workstreams.md — 5 个后续对话框分工
