import type { Commitment } from "@/lib/types";

export type DigestCommitment = Pick<
  Commitment,
  | "id"
  | "user_id"
  | "title"
  | "direction"
  | "due_date"
  | "suggested_follow_up_date"
  | "owner_label"
  | "counterparty_label"
  | "evidence"
>;

export type DigestGroup = {
  userId: string;
  dueToday: DigestCommitment[];
  overdue: DigestCommitment[];
  followUps: DigestCommitment[];
  noDueDate: DigestCommitment[];
};

export type DigestEmailMessage = {
  userId: string;
  email: {
    from: string;
    to: string;
    subject: string;
    html: string;
  };
};

export const DAILY_DIGEST_SUBJECT = "Commitly 每日简报";

export function groupCommitmentsForDigest(commitments: DigestCommitment[], today: string) {
  const groups = new Map<string, DigestGroup>();

  for (const commitment of commitments) {
    const group =
      groups.get(commitment.user_id) ??
      ({
        userId: commitment.user_id,
        dueToday: [],
        overdue: [],
        followUps: [],
        noDueDate: []
      } satisfies DigestGroup);

    if (commitment.due_date === today) {
      group.dueToday.push(commitment);
    } else if (commitment.due_date && commitment.due_date < today) {
      group.overdue.push(commitment);
    } else if (!commitment.due_date) {
      group.noDueDate.push(commitment);
    }

    if (commitment.suggested_follow_up_date === today) {
      group.followUps.push(commitment);
    }

    if (
      group.dueToday.length > 0 ||
      group.overdue.length > 0 ||
      group.followUps.length > 0 ||
      group.noDueDate.length > 0
    ) {
      groups.set(commitment.user_id, group);
    }
  }

  return Array.from(groups.values());
}

export function buildDailyDigestMessages(
  groups: DigestGroup[],
  emailByUserId: Map<string, string | undefined>,
  from: string
) {
  const messages: DigestEmailMessage[] = [];
  let skipped = 0;

  for (const group of groups) {
    const to = emailByUserId.get(group.userId);

    if (!to) {
      skipped += 1;
      continue;
    }

    messages.push({
      userId: group.userId,
      email: {
        from,
        to,
        subject: DAILY_DIGEST_SUBJECT,
        html: renderDailyDigestHtml(group)
      }
    });
  }

  return { messages, skipped };
}

export function renderDailyDigestHtml(group: DigestGroup) {
  const sections = [
    ["今日到期", group.dueToday],
    ["已经逾期", group.overdue],
    ["今日跟进", group.followUps],
    ["无明确日期", group.noDueDate]
  ] as const;

  const body = sections
    .filter(([, commitments]) => commitments.length > 0)
    .map(([title, commitments]) => {
      const items = commitments
        .map(
          (commitment) =>
            `<li><strong>${escapeHtml(commitment.title)}</strong><br/><span>${escapeHtml(
              commitment.owner_label
            )} -> ${escapeHtml(commitment.counterparty_label)}</span><br/><small>${escapeHtml(
              commitment.evidence
            )}</small></li>`
        )
        .join("");

      return `<h2>${title}</h2><ul>${items}</ul>`;
    })
    .join("");

  return `<main><h1>Commitly 每日简报</h1>${body}</main>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
