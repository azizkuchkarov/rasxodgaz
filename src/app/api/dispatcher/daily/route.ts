import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initializeDb } from "@/lib/db";
import { isWithinLastMonth, parseDateOnly } from "@/lib/date";
import { getDispatcherDaily, upsertDispatcherDaily } from "@/lib/gas";
import { badRequest, unauthorized } from "@/lib/http";
import { ALL_DISPATCHER_POINTS, type DispatcherPointCode } from "@/lib/points";

type DailyInputBody = {
  reportDate?: string;
  stations?: Record<string, number>;
};

export async function GET(request: Request) {
  await initializeDb();
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const reportDate = (url.searchParams.get("reportDate") ?? "").trim();
  const parsedDate = parseDateOnly(reportDate);
  if (!parsedDate) {
    return badRequest("reportDate format should be YYYY-MM-DD");
  }

  const data = await getDispatcherDaily(reportDate);
  return NextResponse.json({
    reportDate,
    ...data,
  });
}

export async function POST(request: Request) {
  await initializeDb();
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as DailyInputBody | null;
  const reportDate = body?.reportDate?.trim();
  const parsedDate = reportDate ? parseDateOnly(reportDate) : null;
  if (!parsedDate || !reportDate) {
    return badRequest("reportDate format should be YYYY-MM-DD");
  }

  if (!isWithinLastMonth(parsedDate)) {
    return badRequest("Faqat oxirgi 1 oy ichidagi sanalar uchun kiritish mumkin");
  }

  const stations = {} as Record<DispatcherPointCode, number>;
  for (const point of ALL_DISPATCHER_POINTS) {
    const raw = body?.stations?.[point];
    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return badRequest(`${point} uchun noto'g'ri volume qiymati`);
    }
    stations[point] = numeric;
  }

  const sums = await upsertDispatcherDaily(reportDate, stations, user.sub);
  return NextResponse.json({
    ok: true,
    reportDate,
    ...sums,
  });
}
