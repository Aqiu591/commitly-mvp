# Commitly 项目快照

> 最后更新：2026-05-31
> 给下一个智能体看的，读这个就能立刻上手。

---

## 这是什么

Commitly — 粘贴聊天文本 → AI 提取承诺（谁该做什么、什么时候交）→ 人工审核 → 看板追踪。

大三学生在宿舍从零搭建。Next.js 15 + Supabase + OpenAI + 暗夜玻璃拟态主题。

- GitHub：https://github.com/Aqiu591/commitly-mvp（已开源，MIT）
- Demo：https://commitly-mvp.vercel.app（免登录可直接看 demo 数据）
- 工作目录：`D:\PP`

---

## 当前状态

### 产品

| 模块 | 状态 |
|------|------|
| AI 提取（prompt + strict JSON Schema） | ✅ 完成，6 个失败指标评估 |
| 审核页（确认/修改/删除提取结果） | ✅ 完成 |
| 看板（今日到期/已逾期/我欠别人/别人欠我） | ✅ 完成 |
| Supabase 登录（magic link） | ✅ 完成 |
| RLS 数据隔离 | ✅ 完成 |
| 暗夜玻璃拟态 UI | ✅ 完成 |
| 每日简报邮件（Resend） | ✅ 完成 |
| Demo 免登录体验 | ✅ 刚完成：落地页 CTA 直通看板，未登录隐藏新建按钮 |
| 测试 | 55 个全绿 |

### 推广

小黑盒帖子已发：https://www.xiaoheihe.cn/app/bbs/link/182468724?action=save

**当前收到 2 条评论（都是具体建议）：**

1. **评论 1**：建议全自动化 + 加原文功能。用户认为复制粘贴太麻烦，建议支持"扔文件到文件夹自动识别"。
2. **评论 2**：质疑不如用手机便签，暗示使用成本高。

**已回复建议**：需要在下次迭代做"拖拽上传文件"功能，省掉复制粘贴这一步。

### 已写好的文案（待发）

| 文件 | 平台 | 状态 |
|------|------|------|
| `D:\文档作业\commitly-推广文案-掘金.md` | 掘金 | 待发 |
| `D:\文档作业\commitly-推广文案-知乎.md` | 知乎 | 待发 |
| `D:\文档作业\commitly-推广文案-小红书+即刻.md` | 小红书 + 即刻 | 待发 |
| `D:\文档作业\commitly-推广文案-小黑盒.md` | 小黑盒 | 已发 |

---

## 待办事项（按优先级）

1. **回复小黑盒评论**（评论 1 还没最终回复）
2. **发自媒体文案**：即刻 → 掘金 → 知乎 → 小红书
3. **产品迭代**：拖拽文件上传、文件监听自动导入（来自评论 1 的建议）
4. **回复速度**：所有评论/issue 30 分钟内回

---

## 关键文件

| 文件 | 作用 |
|------|------|
| `D:\PP\AGENTS.md` | 项目执行合约，智能体自动加载 |
| `D:\PP\docs\commitly-runbook.md` | 完整操作手册 |
| `D:\PP\docs\commitly-workstreams.md` | 5 个后续对话框分工 |
| `D:\PP\src\app\dashboard\page.tsx` | 看板页（含 demo 数据 `getDemoCommitments`） |
| `D:\PP\src\app\page.tsx` | 落地页 |
| `D:\PP\src\lib\ai\prompts.ts` | AI 提取 prompt |
| `D:\PP\src\lib\ai\commitment-schema.ts` | AI 输出的 strict JSON Schema |

---

## 当前约束

- 你是学生，零预算，零人脉
- 目标想赚钱，获取 star 和真实用户反馈
- 推广渠道：开发者社区（GitHub），不是 B2B 销售
- 每改完代码先跑 `npm run doctor`，再跑 `npm run sync:github` 同步
