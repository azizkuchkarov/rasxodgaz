import { NextResponse } from "next/server";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ message }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}
