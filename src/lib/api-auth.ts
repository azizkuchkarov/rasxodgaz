import { verifyToken } from "@/lib/auth";

export async function getBearerUser(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
