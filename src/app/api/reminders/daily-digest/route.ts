import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { formatDateInTimezone } from "@/lib/dashboard/sections";
import {
  buildDailyDigestMessages,
  groupCommitmentsForDigest,
  type DigestCommitment
} from "@/lib/email/daily-digest";
import { serverEnv } from "@/lib/env.server";
import { jsonError } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Commitment } from "@/lib/types";
import { formatMissingConfigMessage, missingEnvNameFromError } from "@/lib/user-facing";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleDailyDigest(request);
}

export async function POST(request: NextRequest) {
  return handleDailyDigest(request);
}

async function handleDailyDigest(request: NextRequest) {
  const cronSecret = readRequiredConfig(() => serverEnv.cronSecret(), "CRON_SECRET", "cron");

  if ("response" in cronSecret) {
    return cronSecret.response;
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret.value}`) {
    return jsonError("无权限访问。", 401);
  }

  const today = formatDateInTimezone(new Date(), "UTC");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("commitments")
    .select("*")
    .eq("status", "confirmed");

  if (error) {
    return jsonError("无法加载承诺数据。", 500, error.message);
  }

  const commitments = (data ?? []) as Commitment[];
  const groups = groupCommitmentsForDigest(commitments as DigestCommitment[], today);

  if (groups.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    return jsonError("无法加载简报收件人。", 500, usersError.message);
  }

  const emailByUserId = new Map(usersData.users.map((user) => [user.id, user.email]));
  const resendApiKey = readRequiredConfig(() => serverEnv.resendApiKey(), "RESEND_API_KEY", "email");
  const dailyDigestFrom = readRequiredConfig(() => serverEnv.dailyDigestFrom(), "DAILY_DIGEST_FROM", "email");

  if ("response" in resendApiKey) {
    return resendApiKey.response;
  }

  if ("response" in dailyDigestFrom) {
    return dailyDigestFrom.response;
  }

  const resend = new Resend(resendApiKey.value);
  const { messages, skipped } = buildDailyDigestMessages(groups, emailByUserId, dailyDigestFrom.value);
  let sent = 0;

  for (const message of messages) {
    const group = groups.find((digestGroup) => digestGroup.userId === message.userId);

    if (!group) {
      continue;
    }

    const sendResult = await resend.emails.send(message.email);

    if (sendResult.error) {
      return jsonError("每日简报发送失败。请检查 Resend 发件域名、API Key 和收件人邮箱。", 502, sendResult.error.message);
    }

    await supabase.from("reminders").insert({
      commitment_id: null,
      user_id: message.userId,
      reminder_type: "daily_digest",
      scheduled_for: today,
      sent_at: new Date().toISOString(),
      channel: "email",
      payload: {
        dueToday: group.dueToday.length,
        overdue: group.overdue.length,
        followUps: group.followUps.length,
        noDueDate: group.noDueDate.length
      }
    });

    sent += 1;
  }

  return NextResponse.json({ sent, skipped });
}

function readRequiredConfig(
  read: () => string,
  fallbackName: string,
  context: "cron" | "email"
):
  | { value: string }
  | {
      response: NextResponse;
    } {
  try {
    return { value: read() };
  } catch (error) {
    const missing = missingEnvNameFromError(error) ?? fallbackName;

    return {
      response: jsonError(formatMissingConfigMessage(missing, context), 500, { missing })
    };
  }
}
