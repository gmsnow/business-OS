import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/core/auth/server";
import { TEMPLATE_LIST } from "@/core/platform/templates/grocery";
import { TemplateCard, OtherCard } from "@/components/onboarding/system-cards";

const ICONS: Record<string, string> = {
  "shopping-cart": "🛒",
  "graduation-cap": "🎓",
  "utensils": "🍽️",
  "heart-pulse": "💊",
  "store": "🏪",
};

export default async function OnboardingPage() {
  // If the visitor is already signed in with an active organization, route
  // template selection to install the app into their existing org instead of
  // creating a brand-new account.
  const session = await auth.api.getSession({ headers: await headers() });
  const hasActiveOrg = !!session?.session.activeOrganizationId;

  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Business OS
          </div>
          <h1 className="text-4xl font-bold">ما نوع نشاطك التجاري؟</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            اختر نوع نشاطك وسنقوم بإعداد النظام المناسب لك تلقائياً
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveOrg
              ? "سنثبّت النظام على مؤسستك الحالية مباشرة"
              : "يمكنك تثبيت تطبيقات إضافة لاحقاً من متجر التطبيقات"}
          </p>
        </div>

        {/* Business Type Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_LIST.map((tpl) => (
            <TemplateCard
              key={tpl.code}
              code={tpl.code}
              icon={ICONS[tpl.icon] ?? "📦"}
              nameAr={tpl.nameAr}
              nameEn={tpl.nameEn}
              descriptionAr={tpl.descriptionAr}
              modulesCount={tpl.modules.length}
              hasActiveOrg={hasActiveOrg}
            />
          ))}

          {/* "Other" card */}
          <OtherCard hasActiveOrg={hasActiveOrg} />
        </div>

        {/* Info */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground">كيف يعمل Business OS؟</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
              <div>
                <p className="font-medium text-foreground">اختر نوع النشاط</p>
                <p className="text-sm text-muted-foreground">نحدّد النظام المناسب لنشاطك</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
              <div>
                <p className="font-medium text-foreground">
                  {hasActiveOrg ? "نثبّت النظام" : "نُنشئ حسابك"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveOrg
                    ? "يُضاف التطبيق إلى مؤسستك الحالية"
                    : "يتم إعداد المؤسسة والتطبيق تلقائياً"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
              <div>
                <p className="font-medium text-foreground">ابدأ العمل فوراً</p>
                <p className="text-sm text-muted-foreground">ادخل إلى نظامك الجاهز واستخدمه</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login / Dashboard link */}
        <div className="mt-8 text-center">
          <Link
            href={hasActiveOrg ? "/my-apps" : "/signin"}
            className="text-sm text-muted-foreground hover:text-card-foreground"
          >
            {hasActiveOrg
              ? "العودة إلى تطبيقاتي"
              : "لديك حساب بالفعل؟ تسجيل الدخول"}
          </Link>
        </div>
      </div>
    </main>
  );
}
