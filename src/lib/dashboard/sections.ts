import type { Commitment } from "@/lib/types";

export type DashboardSections = {
  today: Commitment[];
  overdue: Commitment[];
  iOwe: Commitment[];
  theyOwe: Commitment[];
  noDueDate: Commitment[];
  done: Commitment[];
};

export function buildDashboardSections(commitments: Commitment[], today: string): DashboardSections {
  const visible = commitments.filter((commitment) => commitment.status !== "deleted");
  const active = visible.filter((commitment) => commitment.status === "confirmed");

  return {
    today: active.filter((commitment) => commitment.due_date === today),
    overdue: active.filter((commitment) => Boolean(commitment.due_date && commitment.due_date < today)),
    iOwe: active.filter((commitment) => commitment.direction === "i_owe"),
    theyOwe: active.filter((commitment) => commitment.direction === "they_owe"),
    noDueDate: active.filter((commitment) => !commitment.due_date),
    done: visible.filter((commitment) => commitment.status === "done")
  };
}

export function formatDateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
