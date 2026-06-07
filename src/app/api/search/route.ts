import { NextResponse } from "next/server";

import { handleSearchRequest } from "@/lib/search/route-handler";

export async function GET(request: Request) {
  const result = await handleSearchRequest(request);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
