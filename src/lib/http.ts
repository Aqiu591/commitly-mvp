import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function validationError(error: ZodError) {
  return jsonError("请求内容格式不正确。", 400, error.flatten());
}
