import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = (err.issues as any[]).map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return {
        error: NextResponse.json(
          { error: "バリデーションエラー", details: messages },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: "リクエストの解析に失敗しました" },
        { status: 400 }
      ),
    };
  }
}
