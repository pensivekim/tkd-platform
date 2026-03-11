import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import LangSync from "@/components/layout/LangSync";

export const metadata: Metadata = {
  title: "태권도 플랫폼 | 도장관 — 글로벌 태권도 SaaS",
  description: "태권도 종주국 한국의 글로벌 태권도 플랫폼. 도장 SaaS(도장관), AI 품새 채점, 국기원 단증, 원격 심사·연수, 대회 라이브 — 세계 210개국 하나의 플랫폼에서",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <I18nProvider>
          <LangSync />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
