"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [login, setLogin] = useState("dispatcher");
  const [password, setPassword] = useState("dispatcher123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Login failed" }));
      setError(body.message ?? "Login failed");
      return;
    }

    router.push("/dispatcher");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.25),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.3),transparent_30%)]" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <section className="hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur lg:block">
          <div className="inline-flex rounded-full border border-cyan-300/50 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Gaz Monitoring Platform
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">
            Dispatcherlar uchun kunlik gaz rasxodi boshqaruvi
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            12:00 dan 12:00 gacha bo&apos;lgan sutkalik hisobotlar, AB/C line kesimidagi nazorat va API integratsiya
            bitta tizimda.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">AB, C va Summary line bir vaqtning o&apos;zida hisoblanadi</p>
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Oldingi 1 oylik ma&apos;lumotlarni kiritish va tuzatish mavjud</p>
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Unicon API formatiga mos JSON va token endpointlar</p>
          </div>
        </section>

        <form
          onSubmit={onSubmit}
          className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.25)] md:p-10"
        >
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Secure Login</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Gaz Rasxod tizimiga kirish</h2>
            <p className="mt-2 text-sm text-slate-600">admin/admin123 yoki dispatcher/dispatcher123</p>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Login</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "Kirilmoqda..." : "Tizimga kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}
