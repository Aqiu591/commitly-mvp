# Commitly 后续对话框分工

每个对话框只做一个主题，完成后执行 `npm run sync:github -- -Message "..."` 把进度同步到 GitHub。

## 对话框 1：Supabase 真实联调

目标：让登录、数据库保存、RLS 权限和审核流程连上真实 Supabase。

开头提示词：

```text
使用 commitly-mvp skill。我们现在做 Commitly 对话框 1：Supabase 真实联调。只在 D:\PP 工作，不读取或打印 .env.local 密钥值。目标是补齐 Supabase 配置、执行迁移、验证登录 -> 导入 -> 审核 -> 看板流程。完成后运行 npm run doctor，并用 npm run sync:github 同步到 GitHub。
```

完成标准：
- `.env.local` 中存在 Supabase 相关变量名。
- `source_texts`、`commitments`、`reminders` 已在 Supabase 里创建。
- 邮箱登录能进入应用。
- RLS 下只能访问当前用户数据。

## 对话框 2：OpenAI 提取质量和 eval

目标：用 20 条中文样例和真实脱敏文本优化承诺提取质量。

开头提示词：

```text
使用 commitly-mvp skill。我们现在做 Commitly 对话框 2：OpenAI 提取质量和 eval。基于 tests/evals 的中文样例，评估漏提、误提、日期误判、方向误判、编辑率、删除率。不要打印 OPENAI_API_KEY。完成后更新 prompt/schema/tests，并同步 GitHub。
```

完成标准：
- 至少跑完 20 条匿名中文样例。
- 记录主要错误类型。
- prompt/schema/tests 有对应改进。

## 对话框 3：Resend 每日简报

目标：让每日简报邮件能真实发送，并且只包含当前用户数据。

开头提示词：

```text
使用 commitly-mvp skill。我们现在做 Commitly 对话框 3：Resend 每日简报。配置 Resend 变量名，验证 /api/reminders/daily-digest，确认邮件内容中文、只包含当前用户数据。完成后运行测试并同步 GitHub。
```

完成标准：
- Resend 环境变量名存在。
- 手动触发每日简报成功。
- 邮件内容中文、按用户隔离。

## 对话框 4：Vercel 部署

目标：把项目部署到 Vercel，得到线上访问地址。

开头提示词：

```text
使用 commitly-mvp skill。我们现在做 Commitly 对话框 4：Vercel 部署。把 GitHub 仓库 Aqiu591/commitly-mvp 部署到 Vercel，配置环境变量和 Cron，验证线上 /setup、/login、/dashboard 和每日简报接口。完成后同步 GitHub。
```

完成标准：
- Vercel 项目已连接 GitHub 仓库。
- 线上环境变量配置完整。
- Cron 已配置并可调用。
- 线上页面可访问。

## 对话框 5：试用版打磨

目标：把 MVP 从“能跑”打磨成你每天愿意试用的版本。

开头提示词：

```text
使用 commitly-mvp skill。我们现在做 Commitly 对话框 5：试用版打磨。重点优化中文界面、审核体验、看板信息密度、错误提示和使用说明。保持 MVP 范围，不做 CRM/支付/外部聊天集成。完成后运行 doctor:full 并同步 GitHub。
```

完成标准：
- 导入、审核、看板的主要操作不需要看说明也能完成。
- 缺配置、AI 失败、邮件失败都有中文提示。
- README 和 docs 说明清楚下一步。
