import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "每日晨报",
  description: "每天抓取 AI 与金融新闻，整理成中文摘要并自动发送到邮箱。"
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
