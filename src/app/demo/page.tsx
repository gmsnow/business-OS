"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  ShoppingCart,
  Stethoscope,
  Package,
  TrendingUp,
  Wallet,
  Users,
  CalendarDays,
  Receipt,
  ArrowLeft,
} from "lucide-react";

type SystemKey = "store" | "grocery" | "clinic";

interface SystemDef {
  key: SystemKey;
  icon: typeof Store;
  name: string;
  tagline: string;
  stats: { icon: typeof Store; label: string; value: string }[];
  tableTitle: string;
  rows: string[][];
}

const SYSTEMS: SystemDef[] = [
  {
    key: "store",
    icon: Store,
    name: "نظام المتاجر",
    tagline: "إدارة مخزون ومبيعات ومشتريات ونقطة بيع لمتجرك.",
    stats: [
      { icon: Wallet, label: "مبيعات اليوم", value: "12,480 ر.س" },
      { icon: TrendingUp, label: "النمو هذا الشهر", value: "+18%" },
      { icon: Package, label: "المنتجات", value: "1,240" },
      { icon: Users, label: "العملاء", value: "860" },
    ],
    tableTitle: "أحدث المنتجات",
    rows: [
      ["ساعة ذكية برو X", "SKU-001", "450 ر.س", "24"],
      ["سماعات لاسلكية", "SKU-002", "220 ر.س", "61"],
      ["لابتوب ألترا", "SKU-003", "4,999 ر.س", "9"],
      ["ماوس احترافي", "SKU-004", "150 ر.س", "120"],
    ],
  },
  {
    key: "grocery",
    icon: ShoppingCart,
    name: "نظام البقالة",
    tagline: "منتجات وباركود وموردين وعملاء وتقارير ربح لبقالتك.",
    stats: [
      { icon: Wallet, label: "فواتير اليوم", value: "48" },
      { icon: TrendingUp, label: "الربح اليوم", value: "3,240 ر.س" },
      { icon: Package, label: "المنتجات", value: "2,980" },
      { icon: Users, label: "الموردون", value: "32" },
    ],
    tableTitle: "أحدث الفواتير",
    rows: [
      ["INV-2041", "محمد العلي", "اليوم", "540 ر.س"],
      ["INV-2040", "سوبر ماركت النور", "اليوم", "1,120 ر.س"],
      ["INV-2039", "مطعم الشرق", "أمس", "860 ر.س"],
      ["INV-2038", "سارة أحمد", "أمس", "230 ر.س"],
    ],
  },
  {
    key: "clinic",
    icon: Stethoscope,
    name: "نظام سما سنتر",
    tagline: "إدارة المرضى والجلسات والمواعيد والمدفوعات لمركزك الصحي.",
    stats: [
      { icon: Users, label: "المرضى", value: "520" },
      { icon: CalendarDays, label: "جلسات اليوم", value: "34" },
      { icon: Receipt, label: "المواعيد", value: "41" },
      { icon: Wallet, label: "الإيرادات هذا الشهر", value: "64,000 ر.س" },
    ],
    tableTitle: "مواعيد اليوم",
    rows: [
      ["أحمد حسن", "جلسة علاج طبيعي", "09:00", "مؤكد"],
      ["فاطمة سعيد", "فحص طبي", "10:30", "مؤكد"],
      ["خالد عمر", "متابعة", "12:00", "منتظر"],
      ["نورة يوسف", "جلسة أولى", "14:00", "مؤكد"],
    ],
  },
];

export default function DemoPage() {
  const [active, setActive] = useState<SystemKey>("store");
  const system = SYSTEMS.find((s) => s.key === active) ?? SYSTEMS[0];

  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/30">
              <img src="/icons/BO.PNG" alt="Business OS" className="h-full w-full object-contain" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight">Business OS</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/signin" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              تسجيل الدخول
            </Link>
            <Link href="/signup" className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 hover:border-primary/60">
              تجربة مجانية
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            وضع العرض التجريبي
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">تجربة الأنظمة مباشرة</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            استكشف أنظمة Business OS ببيانات تجريبية حية، ثم أنشئ حسابك لتبدأ نظامك الحقيقي.
          </p>
        </div>

        {/* System tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {SYSTEMS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${
                active === s.key
                  ? "border-primary/60 bg-primary/15 text-primary shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <s.icon className="h-5 w-5" />
              {s.name}
            </button>
          ))}
        </div>

        {/* Demo dashboard */}
        <div className="rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <system.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{system.name}</h2>
                <p className="text-sm text-muted-foreground">{system.tagline}</p>
              </div>
            </div>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:brightness-110 active:scale-[0.98]"
            >
              ابدأ نسختك الحقيقية مجاناً
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {system.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-background/60 p-5 transition-all hover:border-primary/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-extrabold">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-background/60">
            <div className="border-b border-border/60 px-5 py-4 font-semibold">{system.tableTitle}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground">
                    {system.rows[0].map((_, i) => (
                      <th key={i} className="px-5 py-3 text-start font-medium">
                        العمود {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {system.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/20">
                      {row.map((cell, j) => (
                        <td key={j} className={`px-5 py-3 ${j === 0 ? "font-semibold" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            البيانات المعروضة تجريبية لأغراض العرض فقط — نظامك الحقيقي يبدأ فور إنشاء حسابك.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link href="/systems" className="text-sm text-muted-foreground hover:text-foreground">
            اختر نظامك وابدأ من الصفر بدلاً من ذلك
          </Link>
        </div>
      </div>
    </main>
  );
}