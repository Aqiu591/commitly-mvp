# Commitly AI Eval

执行 `npm run eval:samples` 可以校验本地 eval 样例格式和自动评分逻辑。

如需跑真实 OpenAI 提取，先在当前 PowerShell 会话中设置 `OPENAI_API_KEY`，然后执行：

```powershell
npm run eval:openai
```

`eval:openai` 会跑完 20 条匿名中文样例并输出聚合分数；脚本不会读取 `.env.local`，也不会打印 `OPENAI_API_KEY`。

每次跑模型后，用下面 6 个指标给 20 条匿名中文样例打分：

- 漏提：应该提取但没有提取的承诺。
- 误提：把纯讨论、寒暄、条件未成立意向误提成了承诺。
- 日期误判：截止日期或建议跟进日期与预期不一致。
- 方向误判：`i_owe` 和 `they_owe` 判断错。
- 编辑率：人工编辑的承诺数量 / 模型提取的承诺数量。
- 删除率：人工删除的承诺数量 / 模型提取的承诺数量。

当前样例重点覆盖的主要错误类型：

- 条件未成立或依赖未来事件的动作被误提，例如“如果法务通过”“收到后两个工作日”。
- 相对日期误判，例如“明天”“下周三”“月底前”“周五前”没有按 `communicated_at` 和 `timezone` 解析。
- 方向误判，例如把“我方/你方/客户/Alice”对应的 `i_owe` 和 `they_owe` 搞反。
- 无明确日期但动作成立时漏掉 `suggested_follow_up_date`。
- 动作对象不完整时误建草稿，例如只说“晚点给”。

默认提取模型：`gpt-5.4-mini`。
Challenger/eval 模型：`gpt-5.5`。
