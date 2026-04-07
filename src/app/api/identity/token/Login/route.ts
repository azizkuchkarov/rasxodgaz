import { NextResponse } from "next/server";
import { createToken, verifyPassword } from "@/lib/auth";
import { initializeDb } from "@/lib/db";

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  await initializeDb();

  const body = (await request.json().catch(() => null)) as LoginBody | null;
  if (!body?.login || !body?.password) {
    return new NextResponse("Invalid login or password", {
      status: 400,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }

  const user = await verifyPassword(body.login, body.password);
  if (!user) {
    return new NextResponse("Invalid login or password", {
      status: 401,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }

  const token = await createToken({ sub: user.login, role: user.role }, "24h");

  return new NextResponse(token, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
