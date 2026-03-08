import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily AI & Finance Digest",
  description: "A Vercel cron MVP that collects AI and finance news, translates it into Chinese, and emails it daily."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
