type EvalSample = {
  id: string;
};

type SelectEvalSamplesOptions = {
  sampleIds?: string | null;
  limit?: string | number | null;
};

export function selectEvalSamples<T extends EvalSample>(
  samples: T[],
  options: SelectEvalSamplesOptions = {}
) {
  const selectedIds = parseSampleIds(options.sampleIds);
  const selected =
    selectedIds.length > 0 ? selectedIds.map((id) => findSampleById(samples, id)) : samples;
  const limit = parseLimit(options.limit);

  return limit === null ? selected : selected.slice(0, limit);
}

function parseSampleIds(value: string | null | undefined) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function findSampleById<T extends EvalSample>(samples: T[], id: string) {
  const sample = samples.find((candidate) => candidate.id === id);

  if (!sample) {
    throw new Error(`Unknown eval sample id: ${id}`);
  }

  return sample;
}

function parseLimit(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Eval sample limit must be a positive integer: ${value}`);
  }

  return limit;
}
