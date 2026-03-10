import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import LangSync from "@/components/layout/LangSync";

export const metadata: Metadata = {
  title: "DOJANGWAN — 태권도 종주국 글로벌 플랫폼",
  description: "국기원 공인 기준의 AI 품새 채점, 블록체인 디지털 단증, 원격 심사와 연수 — 세계 210개국 태권도를 하나의 플랫폼에서",
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
