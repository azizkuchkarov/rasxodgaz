import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "change_me_for_prod");
const SESSION_COOKIE = "session_token";

export type AppRole = "admin" | "dispatcher";

export type SessionPayload = {
  sub: string;
  role: AppRole;
};

export async function verifyPassword(login: string, password: string) {
  const result = await pool.query<{ password_hash: string; role: AppRole }>(
    "SELECT password_hash, role FROM users WHERE login = $1",
    [login],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  const isValid = await bcrypt.compare(password, row.password_hash);

  if (!isValid) {
    return null;
  }

  return { login, role: row.role };
}

export async function createToken(payload: SessionPayload, expiresIn = "12h") {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as AppRole,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
