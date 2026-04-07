import { NextResponse } from "next/server";
import { initializeDb } from "@/lib/db";
import { getApiPoints } from "@/lib/gas";
import { getBearerUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  await initializeDb();
  const user = await getBearerUser(request);
  if (!user) {
    return unauthorized();
  }

  const points = await getApiPoints();
  return NextResponse.json(points, {
    headers: {
      "access-control-allow-origin": "*",
    },
  });
}
