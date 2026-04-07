"use client";

import { useEffect, useMemo, useState } from "react";
import { AB_STATIONS, C_STATIONS } from "@/lib/points";

type Props = {
  login: string;
  role: string;
};

type DailyPayload = {
  reportDate: string;
  stations: Record<string, number>;
  lineAb: number;
  lineC: number;
  lineAbc: number;
};

const initialStations = [...AB_STATIONS, ...C_STATIONS].reduce<Record<string, number>>((acc, point) => {
  acc[point] = 0;
  return acc;
}, {});

function todayDateOnly() {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

export default function DispatcherClient({ login, role }: Props) {
  const [reportDate, setReportDate] = useState(todayDateOnly());
  const [stations, setStations] = useState<Record<string, number>>(initialStations);
  const [lineAbDb, setLineAbDb] = useState(0);
  const [lineCDb, setLineCDb] = useState(0);
  const [lineAbcDb, setLineAbcDb] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lineAbCalculated = useMemo(() => AB_STATIONS.reduce((sum, key) => sum + (stations[key] ?? 0), 0), [stations]);
  const lineCCalculated = useMemo(() => C_STATIONS.reduce((sum, key) => sum + (stations[key] ?? 0), 0), [stations]);
  const lineAbcCalculated = lineAbCalculated + lineCCalculated;

  async function loadData(date: string) {
    setLoading(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/dispatcher/daily?reportDate=${encodeURIComponent(date)}`);
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Yuklashda xatolik" }));
      setError(body.message ?? "Yuklashda xatolik");
      return;
    }

    const body = (await response.json()) as DailyPayload;
    setStations({ ...initialStations, ...body.stations });
    setLineAbDb(body.lineAb ?? 0);
    setLineCDb(body.lineC ?? 0);
    setLineAbcDb(body.lineAbc ?? 0);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(reportDate);
    }, 0);
    return () => clearTimeout(timer);
  }, [reportDate]);

  function setValue(point: string, value: string) {
    const parsed = Number(value);
    setStations((prev) => ({
      ...prev,
      [point]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
    }));
  }

  async function onSave() {
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/dispatcher/daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportDate, stations }),
    });
    setSaving(false);

    const body = await response.json().catch(() => ({ message: "Saqlashda xatolik" }));
    if (!response.ok) {
      setError(body.message ?? "Saqlashda xatolik");
      return;
    }

    setMessage("Muvaffaqiyatli saqlandi");
    setLineAbDb(body.lineAb ?? lineAbCalculated);
    setLineCDb(body.lineC ?? lineCCalculated);
    setLineAbcDb(body.lineAbc ?? lineAbcCalculated);
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Dispatcher Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold">Gaz Rasxod Nazorati</h1>
              <p className="mt-2 text-sm text-slate-300">
                Foydalanuvchi: <span className="font-semibold text-white">{login}</span> ({role})
              </p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Chiqish
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Report Date</span>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-2 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </label>
            <p className="text-sm text-slate-500">Faqat oxirgi 1 oy ichidagi sanalar kiritiladi.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Line AB" calc={lineAbCalculated} db={lineAbDb} tone="blue" />
          <SummaryCard title="Line C" calc={lineCCalculated} db={lineCDb} tone="violet" />
          <SummaryCard title="Line ABC" calc={lineAbcCalculated} db={lineAbcDb} tone="emerald" />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">AB Line stansiyalari</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {AB_STATIONS.map((point) => (
                <StationInput key={point} point={point} value={stations[point] ?? 0} onChange={setValue} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">C Line stansiyalari</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {C_STATIONS.map((point) => (
                <StationInput key={point} point={point} value={stations[point] ?? 0} onChange={setValue} />
              ))}
            </div>
          </section>
        </div>

        <footer className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSave}
              disabled={saving || loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            {loading ? <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">Yuklanmoqda...</span> : null}
            {message ? <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{message}</span> : null}
            {error ? <span className="rounded-lg bg-rose-50 px-3 py-1 text-sm text-rose-700">{error}</span> : null}
          </div>
        </footer>
      </div>
    </main>
  );
}

function StationInput({
  point,
  value,
  onChange,
}: {
  point: string;
  value: number;
  onChange: (point: string, value: string) => void;
}) {
  return (
    <label className="block space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{point}</span>
      <input
        type="number"
        min={0}
        step="0.001"
        value={value}
        onChange={(e) => onChange(point, e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
      />
    </label>
  );
}

function SummaryCard({
  title,
  calc,
  db,
  tone,
}: {
  title: string;
  calc: number;
  db: number;
  tone: "blue" | "violet" | "emerald";
}) {
  const toneClass =
    tone === "blue"
      ? "from-sky-500 to-blue-600"
      : tone === "violet"
        ? "from-violet-500 to-indigo-600"
        : "from-emerald-500 to-teal-600";

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${toneClass} p-[1px] shadow-xl`}>
      <div className="rounded-2xl bg-slate-950/90 p-4 text-white">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-300">{title}</div>
        <div className="mt-2 text-3xl font-semibold">{calc.toFixed(3)}</div>
        <div className="mt-1 text-xs text-slate-300">DB: {db.toFixed(3)}</div>
      </div>
    </div>
  );
}
