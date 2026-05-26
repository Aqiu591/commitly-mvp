import type { Commitment } from "@/lib/types";

export type ReminderInsert = {
  commitment_id: string;
  user_id: string;
  reminder_type: "due" | "follow_up";
  scheduled_for: string;
  channel: "email";
  payload: Record<string, unknown>;
};

export function buildReminderRows(commitments: Pick<Commitment, "id" | "user_id" | "title" | "due_date" | "suggested_follow_up_date">[]) {
  return commitments.flatMap((commitment): ReminderInsert[] => {
    const reminders: ReminderInsert[] = [];

    if (commitment.due_date) {
      reminders.push({
        commitment_id: commitment.id,
        user_id: commitment.user_id,
        reminder_type: "due",
        scheduled_for: commitment.due_date,
        channel: "email",
        payload: { title: commitment.title }
      });
    }

    if (commitment.suggested_follow_up_date) {
      reminders.push({
        commitment_id: commitment.id,
        user_id: commitment.user_id,
        reminder_type: "follow_up",
        scheduled_for: commitment.suggested_follow_up_date,
        channel: "email",
        payload: { title: commitment.title }
      });
    }

    return reminders;
  });
}
