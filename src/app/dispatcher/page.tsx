import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DispatcherClient from "./ui";

export default async function DispatcherPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <DispatcherClient login={user.sub} role={user.role} />;
}
