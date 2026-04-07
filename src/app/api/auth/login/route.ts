import { NextResponse } from "next/server";
import { createToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { initializeDb } from "@/lib/db";

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  await initializeDb();

  const body = (await request.json().catch(() => null)) as LoginBody | null;
  if (!body?.login || !body?.password) {
    return NextResponse.json({ message: "Login va password kerak" }, { status: 400 });
  }

  const user = await verifyPassword(body.login, body.password);
  if (!user) {
    return NextResponse.json({ message: "Login yoki password xato" }, { status: 401 });
  }

  const token = await createToken({ sub: user.login, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
