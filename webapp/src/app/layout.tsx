import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Agentic Booking Assistant',
  description:
    'AI-driven smart booking and preference management assistant with full auditability and operations tooling.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.25),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),_transparent_55%)] text-slate-100 antialiased`}
      >
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-10 lg:px-10">
          <header className="mb-10">
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-200">
                Agentic Control Tower
              </span>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                Smart Booking & Preference Management
              </h1>
              <p className="text-sm text-slate-200/80 md:text-base">
                Capture, reason, and operationalize bookings with deterministic
                audit logs, multi-channel reach, and role-safe automation.
              </p>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-12 text-xs text-slate-400">
            Agentic Booking Grid · deterministic · auditable · fast
          </footer>
        </div>
      </body>
    </html>
  );
}
