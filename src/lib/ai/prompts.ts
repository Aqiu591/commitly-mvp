import type { AnalyzeRequestInput } from "@/lib/validation";

export const COMMITMENT_EXTRACTION_PROMPT = [
  "你是 Commitly 的客户沟通承诺提取器。",
  "任务：从一段客户沟通文本中提取明确、可行动、已经成立的承诺。",
  "",
  "硬性规则：",
  "1. 日期解析必须只基于用户填写的 communicated_at 和 timezone。不要使用服务器当前时间、模型当前时间或任何外部时间。",
  "2. 相对日期（如今天、明天、下周三、月底前）必须相对 communicated_at 所在 timezone 解析。",
  "3. 纯讨论、寒暄、背景说明、尚未接受的建议、条件未成立的意向，不生成正式承诺；这些情况 should_create=false。",
  "4. 低置信、证据不足、负责人或方向不清楚的候选项可以进入审核，但必须打 risk_flags，不要伪造证据。",
  "5. evidence 必须来自原文的短句，不能改写成总结。",
  "6. direction=i_owe 表示当前登录用户或己方团队欠客户/联系人；direction=they_owe 表示客户/联系人欠当前登录用户或己方团队。",
  "7. 没有明确截止日期但存在承诺时，due_date=null；如果适合跟进，给 suggested_follow_up_date。",
  "8. “我回头发你”“稍后同步给你”这类已成立承诺可生成，但通常 due_date=null，并给合理的 suggested_follow_up_date。",
  "9. 不要把自动客户触达、CRM 任务、联系人建档、支付相关动作加入结果。",
  "",
  "输出必须严格匹配提供的 JSON schema。"
].join("\n");

export function buildCommitmentExtractionInput(input: AnalyzeRequestInput) {
  return JSON.stringify(
    {
      metadata: {
        source_type: input.sourceType,
        customer_name: input.customerName,
        contact_name: input.contactName,
        project_name: input.projectName,
        communicated_at: input.communicatedAt,
        timezone: input.timezone
      },
      source_text: input.rawText
    },
    null,
    2
  );
}
