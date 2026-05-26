import type { AiCommitment, CommitmentExtraction } from "@/lib/ai/commitment-schema";

export const EVAL_METRICS = ["漏提", "误提", "日期误判", "方向误判", "编辑率", "删除率"] as const;

export type EvalMetric = (typeof EVAL_METRICS)[number];

export type ExpectedEval = {
  commitmentCount: number;
  directions: Array<AiCommitment["direction"]>;
  dueDates: Array<string | null>;
  suggestedFollowUp?: boolean;
  metrics: readonly EvalMetric[];
};

type RawExpectedEval = {
  commitmentCount: number;
  directions: string[];
  dueDates: Array<string | null>;
  suggestedFollowUp?: boolean;
  metrics: string[];
};

export type EvalScore = {
  expectedCount: number;
  extractedCount: number;
  missingCount: number;
  falsePositiveCount: number;
  dateMismatchCount: number;
  directionMismatchCount: number;
  editCount: number;
  deleteCount: number;
  editRate: number;
  deleteRate: number;
};

type EvalItem = {
  direction: AiCommitment["direction"];
  dueDate: string | null;
  suggestedFollowUpDate: string | null;
  needsSuggestedFollowUp: boolean;
};

type PairScore = {
  dateMismatchCount: number;
  directionMismatchCount: number;
  editCount: number;
};

export function scoreCommitmentExtraction(expected: ExpectedEval, extraction: CommitmentExtraction): EvalScore {
  const expectedItems = buildExpectedItems(expected);
  const actualItems = extraction.commitments.filter(isCreatedCommitment).map(toActualItem);
  const pairScores = matchPairs(expectedItems, actualItems);

  const dateMismatchCount = sum(pairScores, "dateMismatchCount");
  const directionMismatchCount = sum(pairScores, "directionMismatchCount");
  const editCount = sum(pairScores, "editCount");
  const missingCount = Math.max(0, expected.commitmentCount - actualItems.length);
  const falsePositiveCount = Math.max(0, actualItems.length - expected.commitmentCount);
  const deleteCount = falsePositiveCount;

  return {
    expectedCount: expected.commitmentCount,
    extractedCount: actualItems.length,
    missingCount,
    falsePositiveCount,
    dateMismatchCount,
    directionMismatchCount,
    editCount,
    deleteCount,
    editRate: rate(editCount, actualItems.length),
    deleteRate: rate(deleteCount, actualItems.length)
  };
}

export function normalizeExpectedEval(expected: RawExpectedEval): ExpectedEval {
  return {
    commitmentCount: expected.commitmentCount,
    directions: expected.directions.map(parseDirection),
    dueDates: expected.dueDates,
    suggestedFollowUp: expected.suggestedFollowUp,
    metrics: EVAL_METRICS
  };
}

export function summarizeEvalScores(scores: EvalScore[]) {
  const extractedCount = sum(scores, "extractedCount");
  const editCount = sum(scores, "editCount");
  const deleteCount = sum(scores, "deleteCount");

  return {
    sampleCount: scores.length,
    expectedCount: sum(scores, "expectedCount"),
    extractedCount,
    missingCount: sum(scores, "missingCount"),
    falsePositiveCount: sum(scores, "falsePositiveCount"),
    dateMismatchCount: sum(scores, "dateMismatchCount"),
    directionMismatchCount: sum(scores, "directionMismatchCount"),
    editCount,
    deleteCount,
    editRate: rate(editCount, extractedCount),
    deleteRate: rate(deleteCount, extractedCount)
  };
}

function buildExpectedItems(expected: ExpectedEval): EvalItem[] {
  return expected.directions.map((direction, index) => {
    const dueDate = expected.dueDates[index] ?? null;

    return {
      direction,
      dueDate,
      suggestedFollowUpDate: null,
      needsSuggestedFollowUp: Boolean(expected.suggestedFollowUp && dueDate === null)
    };
  });
}

function isCreatedCommitment(commitment: AiCommitment) {
  return commitment.should_create && !commitment.is_conditional && commitment.evidence.trim().length > 0;
}

function toActualItem(commitment: AiCommitment): EvalItem {
  return {
    direction: commitment.direction,
    dueDate: commitment.due_date,
    suggestedFollowUpDate: commitment.suggested_follow_up_date,
    needsSuggestedFollowUp: false
  };
}

function matchPairs(expectedItems: EvalItem[], actualItems: EvalItem[]): PairScore[] {
  const target = Math.min(expectedItems.length, actualItems.length);

  if (target === 0) {
    return [];
  }

  let bestCost = Number.POSITIVE_INFINITY;
  let bestPairs: PairScore[] = [];

  function visit(expectedIndex: number, usedActual: Set<number>, pairs: PairScore[]) {
    if (pairs.length === target) {
      const cost = pairs.reduce(
        (total, pair) => total + pair.dateMismatchCount + pair.directionMismatchCount + pair.editCount,
        0
      );

      if (cost < bestCost) {
        bestCost = cost;
        bestPairs = pairs;
      }

      return;
    }

    if (expectedIndex >= expectedItems.length) {
      return;
    }

    const remainingExpected = expectedItems.length - expectedIndex;
    if (pairs.length + remainingExpected < target) {
      return;
    }

    if (pairs.length + remainingExpected - 1 >= target) {
      visit(expectedIndex + 1, usedActual, pairs);
    }

    for (let actualIndex = 0; actualIndex < actualItems.length; actualIndex += 1) {
      if (usedActual.has(actualIndex)) {
        continue;
      }

      const nextUsed = new Set(usedActual);
      nextUsed.add(actualIndex);

      visit(expectedIndex + 1, nextUsed, [
        ...pairs,
        scorePair(expectedItems[expectedIndex], actualItems[actualIndex])
      ]);
    }
  }

  visit(0, new Set<number>(), []);

  return bestPairs;
}

function scorePair(expected: EvalItem, actual: EvalItem): PairScore {
  const directionMismatchCount = expected.direction === actual.direction ? 0 : 1;
  const dateMismatchCount =
    expected.dueDate !== actual.dueDate || (expected.needsSuggestedFollowUp && !actual.suggestedFollowUpDate) ? 1 : 0;
  const editCount = directionMismatchCount > 0 || dateMismatchCount > 0 ? 1 : 0;

  return {
    dateMismatchCount,
    directionMismatchCount,
    editCount
  };
}

function parseDirection(value: string): AiCommitment["direction"] {
  if (value === "i_owe" || value === "they_owe") {
    return value;
  }

  throw new Error(`Unknown eval direction: ${value}`);
}

function sum<T extends Record<string, number>>(items: T[], key: keyof T) {
  return items.reduce((total, item) => total + item[key], 0);
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}
