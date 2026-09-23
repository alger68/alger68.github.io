import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Power Design 360｜電源設計工作台",
  description: "PFC + LLC 解析計算、16 面向工程檢核、方案比較與原廠技術資源。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
