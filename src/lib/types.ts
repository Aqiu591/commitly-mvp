export type Direction = "i_owe" | "they_owe";

export type CommitmentStatus = "draft" | "confirmed" | "done" | "deleted";

export type SourceTextStatus = "pending" | "analyzed" | "failed" | "confirmed";

export type SourceText = {
  id: string;
  user_id: string;
  source_type: string;
  customer_name: string;
  contact_name: string | null;
  project_name: string | null;
  communicated_at: string;
  timezone: string;
  raw_text: string | null;
  raw_text_deleted_at: string | null;
  analysis_status: SourceTextStatus;
  ai_model: string | null;
  ai_response: unknown | null;
  ai_error: string | null;
  created_at: string;
  updated_at: string;
};

export type Commitment = {
  id: string;
  source_text_id: string;
  user_id: string;
  status: CommitmentStatus;
  direction: Direction;
  title: string;
  details: string;
  owner_label: string;
  counterparty_label: string;
  evidence: string;
  due_date: string | null;
  due_time: string | null;
  due_timezone: string | null;
  suggested_follow_up_date: string | null;
  confidence: number;
  confidence_reason: string;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
};

export type Reminder = {
  id: string;
  commitment_id: string | null;
  user_id: string;
  reminder_type: "daily_digest" | "due" | "follow_up";
  scheduled_for: string;
  sent_at: string | null;
  channel: "email";
  payload: Record<string, unknown>;
  created_at: string;
};
