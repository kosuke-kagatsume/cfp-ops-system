import { NextRequest } from "next/server";

/** Create a GET request */
export function createGetRequest(
  url: string,
  params?: Record<string, string>
): NextRequest {
  const u = new URL(url, "http://localhost:3000");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, v);
    }
  }
  return new NextRequest(u);
}

/** Create a POST/PUT request with JSON body */
export function createJsonRequest(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Extract JSON response body and status */
export async function parseResponse(response: Response) {
  const status = response.status;
  const body = await response.json();
  return { status, body };
}
