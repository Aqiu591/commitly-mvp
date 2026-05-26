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

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleDailyDigest(request);
}

export async function POST(request: NextRequest) {
  return handleDailyDigest(request);
}

async function handleDailyDigest(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${serverEnv.cronSecret()}`) {
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
  const resend = new Resend(serverEnv.resendApiKey());
  const { messages, skipped } = buildDailyDigestMessages(groups, emailByUserId, serverEnv.dailyDigestFrom());
  let sent = 0;

  for (const message of messages) {
    const group = groups.find((digestGroup) => digestGroup.userId === message.userId);

    if (!group) {
      continue;
    }

    const sendResult = await resend.emails.send(message.email);

    if (sendResult.error) {
      return jsonError("每日简报发送失败。", 502, sendResult.error.message);
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
