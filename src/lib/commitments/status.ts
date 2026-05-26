import type { CommitmentStatus } from "@/lib/types";

const allowedTransitions: Record<CommitmentStatus, CommitmentStatus[]> = {
  draft: ["confirmed", "deleted"],
  confirmed: ["done", "deleted"],
  done: ["confirmed"],
  deleted: []
};

export function canTransitionCommitmentStatus(from: CommitmentStatus, to: CommitmentStatus) {
  if (from === to) {
    return true;
  }

  return allowedTransitions[from].includes(to);
}

export function assertCommitmentTransition(from: CommitmentStatus, to: CommitmentStatus) {
  if (!canTransitionCommitmentStatus(from, to)) {
    throw new Error(`承诺状态不能这样切换：${from} -> ${to}`);
  }
}
