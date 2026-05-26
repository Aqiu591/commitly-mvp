export class AiRefusalError extends Error {
  constructor(message = "模型拒绝生成结构化提取结果。") {
    super(message);
    this.name = "AiRefusalError";
  }
}

export class AiIncompleteError extends Error {
  constructor(message = "模型响应未完成。") {
    super(message);
    this.name = "AiIncompleteError";
  }
}

export class AiParseError extends Error {
  constructor(message = "模型响应不是有效的结构化 JSON。") {
    super(message);
    this.name = "AiParseError";
  }
}

type ResponseLike = {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  output_text?: string;
  output_parsed?: unknown;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
};

export function parseStructuredResponse(response: ResponseLike) {
  if (response.output_parsed) {
    return response.output_parsed;
  }

  if (response.status && response.status !== "completed") {
    const reason = response.incomplete_details?.reason;
    throw new AiIncompleteError(reason ? `模型响应未完成：${reason}` : undefined);
  }

  const directText = response.output_text;
  if (directText) {
    return parseJsonText(directText);
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content.type === "refusal") {
        throw new AiRefusalError(content.refusal);
      }

      if (content.type === "output_text" && content.text) {
        return parseJsonText(content.text);
      }
    }
  }

  throw new AiParseError();
}

function parseJsonText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    throw new AiParseError();
  }
}
