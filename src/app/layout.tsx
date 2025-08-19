import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design AI | تحلیل نقشه",
  description: "آپلود و تحلیل نقشه معماری با مدل دیداری",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
