# Commitly MVP

Commitly 是一个轻量级客户沟通承诺追踪工具——导入会议纪要、邮件、聊天记录，AI 自动提取承诺，人工审核确认后在看板追踪。

不做 CRM，不连通讯工具，只做承诺追踪一件事。

## 功能亮点

- **AI 承诺提取**：粘贴任意沟通文本（会议纪要、邮件、聊天记录、电话摘要），OpenAI 自动识别"我该做"和"对方该做"的事项，标注方向、负责人、截止日期和原文证据
- **人工审核确认**：删掉 AI 误判的项，修正提取结果，确认后再进入看板——AI 负责初筛，人负责决策
- **看板追踪**：按逾期、今日到期、未来跟进、待定日期分组查看，一眼看清该催什么、该做什么
- **每日邮件简报**：配置 Resend 和 Vercel Cron 后，自动发送当日到期和跟进的承诺摘要
- **自带数据隔离**：基于 Supabase RLS，每个用户只能访问自己的数据，无需额外配置权限

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件
cp .env.example .env.local
```

编辑 `.env.local`，填入 Supabase、OpenAI、Resend 的真实值（变量名参考下方环境变量说明）。

```bash
# 3. 初始化数据库
# 在 Supabase SQL Editor 中执行 supabase/migrations/001_init.sql

# 4. 配置 Supabase Auth Redirect URLs
# 在 Supabase Authentication → URL Configuration 中添加：
#   http://localhost:3000/auth/callback
#   http://127.0.0.1:3000/auth/callback

# 5. 运行环境检查
npm run doctor

# 6. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`。缺少 Supabase 配置时会进入 `/setup` 页面；缺少 OpenAI 配置时，导入页会显示中文提示。

## 环境变量

所有变量见 `.env.example`。必填项：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（服务端操作） |
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `RESEND_API_KEY` | Resend API 密钥（邮件发送） |
| `DAILY_DIGEST_FROM` | 每日简报发件人地址 |
| `CRON_SECRET` | Vercel Cron 触发的密钥 |

可选变量：`NEXT_PUBLIC_APP_URL`（默认 `http://localhost:3000`）、`OPENAI_ANALYSIS_MODEL`、`OPENAI_EVAL_MODEL`。

## 常用命令

```bash
npm run dev            # 启动开发服务器
npm run build          # 生产构建
npm test               # 运行所有测试
npm run test:unit      # 仅单元测试
npm run test:integration  # 仅集成测试
npm run eval:samples   # AI 评估样例测试
npm run eval:openai    # 完整 OpenAI 评估
npm run lint           # TypeScript 类型检查
npm run doctor         # 环境完整性检查
npm run doctor:full    # 完整环境检查（含可选配置）
npm run sync:github -- -Message "提交信息"  # 同步到 GitHub
```

每日简报支持两种触发方式：`POST /api/reminders/daily-digest` 手动触发，`GET /api/reminders/daily-digest` 供 Vercel Cron 使用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router |
| 认证与数据库 | Supabase Auth + PostgreSQL + RLS |
| AI 提取 | OpenAI Responses API + strict JSON Schema |
| 邮件 | Resend |
| 定时任务 | Vercel Cron |
| 测试 | Vitest（单元 / 集成 / AI eval） |
| 类型校验 | TypeScript + Zod |

## License

MIT
