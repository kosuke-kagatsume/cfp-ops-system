import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Prisma known error codes mapping
 */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "一意制約違反です。重複するレコードが存在します" },
  P2025: { status: 404, message: "対象のレコードが見つかりません" },
  P2003: { status: 400, message: "参照先のレコードが見つかりません" },
  P2014: { status: 400, message: "関連するレコードが存在するため操作できません" },
};

/**
 * API route handler wrapper for unified error handling.
 * Catches all errors, logs to Sentry, and returns appropriate HTTP responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  const wrapped = async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      Sentry.captureException(error);

      // Prisma known errors
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code: string }).code === "string"
      ) {
        const code = (error as { code: string }).code;
        const mapped = PRISMA_ERROR_MAP[code];
        if (mapped) {
          return NextResponse.json(
            { error: mapped.message },
            { status: mapped.status }
          );
        }
      }

      // Generic server error
      return NextResponse.json(
        { error: "サーバーエラーが発生しました" },
        { status: 500 }
      );
    }
  };
  return wrapped as T;
}
