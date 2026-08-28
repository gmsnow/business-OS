"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import {
  Package, ShoppingCart, Receipt, Wallet, Monitor, BarChart3,
  Shield, Globe, ArrowLeft, CheckCircle2, Sparkles, Zap, Users,
  LayoutDashboard, Settings, TrendingUp, Star, CreditCard, Boxes,
  Store, ArrowDown, ChevronDown,
} from "lucide-react";
import ScrollReveal from "@/components/landing/scroll-reveal";
import TiltCard from "@/components/landing/tilt-card";
import Parallax from "@/components/landing/parallax";
import MouseGlow from "@/components/landing/mouse-glow";
import MagneticButton from "@/components/landing/magnetic-button";
import TextScramble from "@/components/landing/text-scramble";
import ScrollProgress from "@/components/landing/scroll-progress";
import GlowCard from "@/components/landing/glow-card";
import AnimatedCounter from "@/components/landing/animated-counter";
import SplitText from "@/components/landing/split-text";

/* ── 3D Hero (lazy-loaded, excluded from server render) ─── */
const Hero3D = dynamic(() => import("@/components/landing/hero-3d"), {
  ssr: false,
  loading: () => null,
});

/* ── SVG ──────────────────────────────────────────────── */

function HeadsetIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

/* ── Data ──────────────────────────────────────────────── */

const features = [
  { icon: Package, title: "إدارة المخزون", desc: "تتبع المنتجات والكميات والتنبيهات التلقائية للنقص مع دعم الباركود", color: "from-primary to-[#0263D1]" },
  { icon: ShoppingCart, title: "المبيعات", desc: "إدارة الطلبات والفواتير وعملاءك مع تقارير أرباح فورية", color: "from-[#03EABC] to-[#0263D1]" },
  { icon: Receipt, title: "المشتريات", desc: "تتبع الموردين والطلبات وظروف الدفع وتكاليف الشحن", color: "from-[#0263D1] to-primary" },
  { icon: Wallet, title: "الإدارة المالية", desc: "تقارير مالية شاملة وإدارة التدفقات النقدية والميزانيات", color: "from-primary to-[#03EABC]" },
  { icon: Monitor, title: "نقطة البيع", desc: "واجهة بيع سريعة وسهلة مع دعم الباركود والشاشات اللمسية", color: "from-[#0263D1] to-primary" },
  { icon: BarChart3, title: "التقارير والتحليلات", desc: "لوحات معلومات تفاعلية ورسوم بيانية لمتابعة أداء عملك", color: "from-primary to-[#0263D1]" },
];

const statsData = [
  { to: 500, display: "+٥٠٠", label: "نظام مُفعّل", icon: Store },
  { to: 24, display: "٢٤/٧", label: "دعم فني مباشر", icon: HeadsetIcon },
  { to: 99, display: "٩٩.٩٪", label: "وقت التشغيل", icon: Shield },
  { to: 3, display: "٣ دقائق", label: "إعداد سريع", icon: Zap },
];

const testimonials = [
  { name: "أحمد العلي", role: "مدير متجر تقنية", text: "بيزنس أو إس غيّر طريقة إدارتي لمتجر. التقارير دقيقة والواجهة سهلة جداً.", stars: 5 },
  { name: "فاطمة الزهراء", role: "صاحبة صيدلية", text: "نظام ممتاز لإدارة المخزون. التنبيهات التلقائية وفّرت عليّ ساعات من العمل.", stars: 5 },
  { name: "محمد السعود", role: "مدير مطعم", text: "أفضل نظام نقطة بيع استخدمته. سريع وبسيط ويدعم كل احتياجاتنا.", stars: 5 },
];

const businessTypes = ["متاجر إلكترونية", "مطاعم ومقاهي", "صيدليات", "متاجر بقالة", "عيادات طبية", "ورش عمل", "مكاتب خدمات", "شركات تجارية"];

/* ── Floating Particles ──────────────────────────────── */

const FLOAT_PARTICLES = Array.from({ length: 20 }, () => ({
  width: 2 + Math.random() * 4,
  height: 2 + Math.random() * 4,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 5,
}));

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function FloatingParticles() {
  const mounted = useIsMounted();
  if (!mounted) return null;
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {FLOAT_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float-particle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Hero cursor glow (follows the mouse — "live" feel) ── */

function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 40 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      });
    };
    el.addEventListener("mousemove", handleMove);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
      style={{
        background: `radial-gradient(560px circle at ${pos.x}px ${pos.y}px, rgba(3,234,188,0.07), transparent 55%)`,
      }}
    />
  );
}

/* ── Page ──────────────────────────────────────────────── */

export default function HomePage() {
  const mounted = useIsMounted();

  return (
    <div className="noise-overlay">
      <ScrollProgress />

      <main className="min-h-screen bg-background text-foreground overflow-hidden" dir="rtl" style={{ scrollBehavior: "smooth" }}>

          {/* ═══════════════════════════════════════════════════════
              NAVBAR
          ═══════════════════════════════════════════════════════ */}
          <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:scale-110">
                  <img src="/icons/BO.PNG" alt="Business OS" className="h-full w-full object-contain" />
                </div>
                <span className="text-lg font-bold tracking-tight">بيزنس أو إس</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/signin" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  تسجيل الدخول
                </Link>
                <MagneticButton strength={0.2}>
                  <Link href="/signup" className="relative rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] inline-block">
                    إنشاء حساب
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </nav>

          {/* ═══════════════════════════════════════════════════════
              HERO
          ═══════════════════════════════════════════════════════ */}
          <section className="relative isolate flex min-h-screen items-center justify-center">
            <FloatingParticles />
            <HeroGlow />

            {/* Animated mesh background */}
            <div className="absolute inset-0 -z-20 overflow-hidden">
              <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px] animate-float" />
              <div className="absolute top-1/3 -left-40 h-[450px] w-[450px] rounded-full bg-[#0263D1]/[0.05] blur-[100px] animate-float delay-300" />
              <div className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/[0.04] blur-[100px] animate-float delay-500" />
              <div className="absolute inset-0 dot-grid text-foreground/[0.02]" />
            </div>

            {/* Live 3D WebGL core (tech) */}
            <Hero3D />

            <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 text-center">
              <ScrollReveal delay={0} direction="up" distance={40}>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  منصة إدارة أعمال احترافية
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100} direction="up" distance={50}>
                <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl md:text-[5.2rem]" style={{ perspective: "1000px" }}>
                  {mounted ? (
                    <SplitText text="كل ما تحتاجه لإدارة" className="inline" />
                  ) : (
                    "كل ما تحتاجه لإدارة"
                  )}{" "}
                  <span className="relative inline-block" style={{ transformStyle: "preserve-3d" }}>
                    <span className="text-gradient">
                      {mounted ? <TextScramble text="أعمالك" speed={40} /> : "أعمالك"}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 8C40 2 160 2 198 8" stroke="currentColor" strokeWidth="3" className="text-primary/30" strokeLinecap="round" />
                    </svg>
                  </span>
                  <br />
                  {mounted ? (
                    <SplitText text="في مكان واحد" className="inline" />
                  ) : (
                    "في مكان واحد"
                  )}
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200} direction="up" distance={50}>
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  نظام متكامل لإدارة متجرك أو مؤسستك — مخزون، مبيعات، مشتريات، مالية،
                  ونقاط بيع. متعدد المستأجرين ويدعم الهوية البصرية الخاصة بك.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300} direction="up" distance={40}>
                <div className="mt-12 flex items-center justify-center">
                  <MagneticButton strength={0.15}>
                    <Link href="/systems" className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]">
                      <Zap className="h-5 w-5" />
                      اختر نظامك
                      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                      <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </MagneticButton>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={400} direction="up" distance={30}>
                <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                  {["مجاني للبدء", "بدون بطاقة ائتمان", "إعداد في دقائق"].map((t) => (
                    <span key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {t}
                    </span>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={800} direction="up" distance={20}>
                <div className="mt-16 flex justify-center">
                  <MagneticButton strength={0.4}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 hover:text-primary transition-colors">
                      <span className="text-xs">اكتشف المزيد</span>
                      <ArrowDown className="h-5 w-5 animate-bounce" />
                    </div>
                  </MagneticButton>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              MARQUEE
          ═══════════════════════════════════════════════════════ */}
          <section className="border-y border-border/50 bg-secondary/20 py-5 overflow-hidden">
            <div className="animate-marquee flex whitespace-nowrap">
              {[...businessTypes, ...businessTypes].map((type, i) => (
                <span key={i} className="mx-8 flex items-center gap-2 text-sm text-muted-foreground/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  {type}
                </span>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              3D DASHBOARD MOCKUP
          ═══════════════════════════════════════════════════════ */}
          <section className="py-20 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
              <ScrollReveal direction="rotate" distance={20}>
                <div style={{ perspective: "1200px" }}>
                  <div
                    className="relative rounded-3xl border border-border/60 bg-card/50 p-3 shadow-2xl shadow-primary/5 backdrop-blur-sm"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: "rotateX(2deg) rotateY(-1deg)",
                      transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(20px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "rotateX(2deg) rotateY(-1deg)"; }}
                  >
                    <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
                      <div className="h-3 w-3 rounded-full bg-red-400/70" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
                      <div className="h-3 w-3 rounded-full bg-green-400/70" />
                      <div className="mx-auto flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        businessos.app
                      </div>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-4 sm:grid-rows-3">
                      <div className="hidden rounded-2xl border border-border/40 bg-secondary/30 p-4 sm:row-span-3 sm:block">
                        <div className="mb-6 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/20" />
                          <div className="h-3 w-16 rounded bg-foreground/10" />
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 ${i === 1 ? "bg-primary/10" : ""}`}>
                            <div className={`h-4 w-4 rounded ${i === 1 ? "bg-primary/40" : "bg-foreground/8"}`} />
                            <div className={`h-2.5 rounded ${i === 1 ? "bg-primary/30" : "bg-foreground/6"} ${i % 2 === 0 ? "w-14" : "w-12"}`} />
                          </div>
                        ))}
                      </div>
                      {[
                        { label: "المبيعات", value: "٤٥,٢٠٠", change: "+١٢٪", color: "bg-primary/10 text-primary" },
                        { label: "العملاء", value: "١,٢٣٠", change: "+٨٪", color: "bg-primary/10 text-primary" },
                        { label: "المنتجات", value: "٣٤٢", change: "+٥", color: "bg-amber-500/10 text-amber-500" },
                        { label: "الطلبات", value: "٨٩", change: "+١٥٪", color: "bg-violet-500/10 text-violet-500" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-border/40 bg-secondary/20 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.color}`}>
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium text-primary">{kpi.change}</span>
                          </div>
                          <div className="text-2xl font-bold">{kpi.value}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</div>
                        </div>
                      ))}
                      <div className="sm:col-span-2 rounded-2xl border border-border/40 bg-secondary/20 p-4">
                        <div className="mb-3 text-xs font-medium text-muted-foreground">المبيعات الشهرية</div>
                        <div className="flex items-end gap-2 h-28">
                          {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2 rounded-2xl border border-border/40 bg-secondary/20 p-4">
                        <div className="mb-3 text-xs font-medium text-muted-foreground">آخر الطلبات</div>
                        <div className="space-y-2.5">
                          {[
                            { name: "طلب #١٢٣٤", amount: "١,٢٥٠ ر.س", status: "مكتمل" },
                            { name: "طلب #١٢٣٣", amount: "٨٩٠ ر.س", status: "قيد التنفيذ" },
                            { name: "طلب #١٢٣٢", amount: "٢,١٠٠ ر.س", status: "مكتمل" },
                          ].map((o) => (
                            <div key={o.name} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                              <div>
                                <div className="text-xs font-medium">{o.name}</div>
                                <div className="text-[10px] text-muted-foreground">{o.amount}</div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${o.status === "مكتمل" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}>{o.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              FEATURES — GLOW + TILT
          ═══════════════════════════════════════════════════════ */}
          <section className="relative border-t border-border/50 bg-secondary/20 py-24 md:py-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="mx-auto max-w-7xl px-6">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">المميزات</span>
                  <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                    {mounted ? <TextScramble text="كل الأدوات التي تحتاجها" speed={25} /> : "كل الأدوات التي تحتاجها"}
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-muted-foreground">وحدات متكاملة صُممت لتناسب جميع أنواع الأعمال</p>
                </div>
              </ScrollReveal>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f, i) => (
                  <ScrollReveal key={f.title} delay={i * 80} direction="up" distance={50}>
                    <GlowCard className="h-full rounded-3xl">
                      <MouseGlow className="h-full rounded-3xl">
                        <TiltCard intensity={8} className="h-full">
                          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 h-full">
                            <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`} />
                            <div className="relative">
                              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                                <f.icon className="h-7 w-7" />
                              </div>
                              <h3 className="mb-2.5 text-xl font-bold">{f.title}</h3>
                              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </div>
                          </div>
                        </TiltCard>
                      </MouseGlow>
                    </GlowCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              STATS — ANIMATED COUNTERS + PARALLAX
          ═══════════════════════════════════════════════════════ */}
          <section className="py-24 md:py-32">
            <Parallax speed={0.15}>
              <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                  {statsData.map((s, i) => (
                    <ScrollReveal key={s.label} delay={i * 100} direction="scale" distance={30}>
                      <MouseGlow className="h-full rounded-3xl">
                        <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />
                          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:rotate-12">
                            <s.icon className="h-7 w-7" />
                          </div>
                          <div className="relative text-4xl font-extrabold text-foreground sm:text-5xl">
                            {s.display}
                          </div>
                          <div className="relative mt-2 text-sm text-muted-foreground">{s.label}</div>
                        </div>
                      </MouseGlow>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </Parallax>
          </section>

          {/* ═══════════════════════════════════════════════════════
              HIGHLIGHTS — SPLIT 3D
          ═══════════════════════════════════════════════════════ */}
          <section className="relative border-t border-border/50 bg-secondary/20 py-24 md:py-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <ScrollReveal direction="right" distance={60}>
                  <div>
                    <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">مصمم للعمل العربي</span>
                    <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                      واجهة عربية
                      <br />
                      <span className="text-gradient">بالكامل</span>
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                      واجهة عربية كاملة من اليمين لليسار مع دعم الهوية البصرية
                      الخاصة بعلامتك التجارية. خيارات تخصيص الألوان والشعار.
                    </p>
                    <div className="mt-10 space-y-4">
                      {[
                        { icon: LayoutDashboard, text: "واجهة عربية بالكامل (RTL)" },
                        { icon: Users, text: "تعدد المستأجرين مع هوية مخصصة" },
                        { icon: Globe, text: "تطبيق ويب قابل للتثبيت (PWA)" },
                        { icon: Settings, text: "تخصيص شامل حسب نوع النشاط" },
                      ].map((item, j) => (
                        <ScrollReveal key={item.text} delay={j * 100} direction="right" distance={30}>
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 hover:scale-110">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span className="font-medium">{item.text}</span>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" distance={60} delay={200}>
                  <div className="grid grid-cols-2 gap-4" style={{ perspective: "1000px" }}>
                    {[
                      { icon: Shield, title: "آمن وموثوق", desc: "تشفير كامل للبيانات ونسخ احتياطي تلقائي" },
                      { icon: CreditCard, title: "المدفوعات", desc: "دعم جميع وسائل الدفع المحلية والعالمية" },
                      { icon: Boxes, title: "لا حدود للبيانات", desc: "آلاف المنتجات والموردين والعملاء بدون قيود" },
                    ].map((card, i) => (
                      <GlowCard key={card.title} className={`${i === 2 ? "col-span-2" : ""} rounded-3xl`}>
                        <TiltCard intensity={10} className="h-full">
                          <div className="group flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:rotate-6 group-hover:scale-110">
                              <card.icon className="h-7 w-7" />
                            </div>
                            <span className="font-bold">{card.title}</span>
                            <span className="text-sm leading-relaxed text-muted-foreground">{card.desc}</span>
                          </div>
                        </TiltCard>
                      </GlowCard>
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              TESTIMONIALS — 3D GLOW TILT
          ═══════════════════════════════════════════════════════ */}
          <section className="py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">آراء العملاء</span>
                  <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">يثق بنا آلاف العملاء</h2>
                  <p className="mx-auto mt-4 max-w-xl text-muted-foreground">انضم لآلاف الأعمال التي تستخدم بيزنس أو إس يومياً</p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 md:grid-cols-3" style={{ perspective: "1200px" }}>
                {testimonials.map((t, i) => (
                  <ScrollReveal key={t.name} delay={i * 150} direction="up" distance={60}>
                    <GlowCard className="h-full rounded-3xl">
                      <MouseGlow className="h-full rounded-3xl">
                        <TiltCard intensity={6}>
                          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full">
                            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-150" />
                            <div className="relative">
                              <div className="mb-4 flex gap-1">
                                {Array.from({ length: t.stars }).map((_, j) => (
                                  <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400 transition-transform duration-300 hover:scale-125 hover:rotate-12" />
                                ))}
                              </div>
                              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                                  {t.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold">{t.name}</div>
                                  <div className="text-xs text-muted-foreground">{t.role}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TiltCard>
                      </MouseGlow>
                    </GlowCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              HOW IT WORKS — 3D STEPS
          ═══════════════════════════════════════════════════════ */}
          <section className="relative border-t border-border/50 bg-secondary/20 py-24 md:py-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="mx-auto max-w-7xl px-6">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">كيف يعمل</span>
                  <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">ثلاث خطوات فقط</h2>
                </div>
              </ScrollReveal>
              <div className="grid gap-8 md:grid-cols-3" style={{ perspective: "1000px" }}>
                {[
                  { step: "١", title: "اختر نظامك", desc: "حدد نوع نشاطك التجاري من بين الأنظمة المتاحة" },
                  { step: "٢", title: "خصّص واجهتك", desc: "أضف شعاراتك وألوانك وبيانات شركتك" },
                  { step: "٣", title: "ابدأ العمل", desc: "أضف منتجاتك وعملاءك وابدأ في إدارة أعمالك" },
                ].map((s, i) => (
                  <ScrollReveal key={s.step} delay={i * 200} direction="up" distance={70}>
                    <GlowCard className="h-full rounded-3xl">
                      <TiltCard intensity={12} className="h-full">
                        <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-border/60 bg-card/60 p-10 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full">
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[#0263D1] text-3xl font-extrabold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-2xl hover:shadow-primary/40">
                            {s.step}
                          </div>
                          <div>
                            <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                          </div>
                        </div>
                      </TiltCard>
                    </GlowCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              FINAL CTA — PARALLAX + GLOW + MAGNETIC
          ═══════════════════════════════════════════════════════ */}
          <section className="py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
              <Parallax speed={0.1}>
                <ScrollReveal direction="scale" distance={30}>
                  <GlowCard glowColor="rgba(255,255,255,0.3)" className="rounded-[2rem]">
                    <MouseGlow className="rounded-[2rem]">
                        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-bl from-[#0263D1] via-primary to-[#03EABC] px-8 py-20 text-center sm:px-16 animate-gradient">
                        <FloatingParticles />
                        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                        <div className="relative">
                          <h2 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                            جاهز لتنمية أعمالك؟
                          </h2>
                          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
                            ابدأ الآن مجاناً واكتشف كيف يمكن لبيزنس أو إس أن يُحوّل طريقة
                            إدارة أعمالك.
                          </p>
                          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <MagneticButton strength={0.2}>
                               <Link href="/systems" className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-10 py-4 text-base font-bold text-[#0263D1] shadow-xl transition-all hover:shadow-2xl hover:brightness-110 active:scale-[0.98]">
                                اختر نظامك الآن
                                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                              </Link>
                            </MagneticButton>
                            <MagneticButton strength={0.2}>
                              <Link href="/signin" className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 px-10 py-4 text-base font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10">
                                تسجيل الدخول
                              </Link>
                            </MagneticButton>
                          </div>
                        </div>
                      </div>
                    </MouseGlow>
                  </GlowCard>
                </ScrollReveal>
              </Parallax>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              FOOTER
          ═══════════════════════════════════════════════════════ */}
          <footer className="border-t border-border/50 py-12">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden"><img src="/icons/BO.PNG" alt="Business OS" className="h-full w-full object-contain" /></div>
                <span className="text-sm font-bold">بيزنس أو إس</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/signin" className="transition-colors hover:text-foreground">تسجيل الدخول</Link>
                <Link href="/systems" className="transition-colors hover:text-foreground">الأنظمة</Link>
              </div>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} بيزنس أو إس. جميع الحقوق محفوظة.</p>
            </div>
          </footer>
        </main>
    </div>
  );
}
