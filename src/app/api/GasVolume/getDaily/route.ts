import { NextResponse } from "next/server";
import { initializeDb } from "@/lib/db";
import { parseDateOnly, toDailyTimestamp } from "@/lib/date";
import { getDailyVolume } from "@/lib/gas";
import { getBearerUser } from "@/lib/api-auth";
import { badRequest, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  await initializeDb();
  const user = await getBearerUser(request);
  if (!user) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const requestedDate = (url.searchParams.get("requestedDate") ?? "").trim();
  const pointCode = (url.searchParams.get("pointCode") ?? "").trim().toLowerCase();

  if (!requestedDate || !pointCode) {
    return badRequest("requestedDate and pointCode are required");
  }

  const parsedDate = parseDateOnly(requestedDate);
  if (!parsedDate) {
    return badRequest("Invalid requestedDate format, expected YYYY-MM-DD");
  }

  const volume = await getDailyVolume(requestedDate, pointCode);

  return NextResponse.json(
    {
      requestedDate,
      pointCode,
      values: volume === null ? [] : [{ timestamp: toDailyTimestamp(parsedDate), volume }],
    },
    {
      headers: {
        "access-control-allow-origin": "*",
      },
    },
  );
}
