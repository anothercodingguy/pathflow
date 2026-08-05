import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PathFlow | Strava for AI Agents & Telemetry Inspector',
  description: 'High-velocity telemetry feed, visual DAG trace map inspector, and micro-benchmark leaderboards for AI agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-strava-orange selection:text-white flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-400">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider">PATHFLOW</span>
              <span>— Telemetry Engine for AI Athlete Fleets</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
              <span>OTel v1.28</span>
              <span>•</span>
              <span>ClickHouse Telemetry Storage</span>
              <span>•</span>
              <span className="text-strava-orange">High Velocity #FC4C02</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
