import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'PathFlow | DevTools for AI Agents',
  description: 'Full-width IDE trace inspector, Flame Graphs, Timelines, Critical Path Highlighting, and GitHub PR-style run diffing for AI agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('light');` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#09090B] text-zinc-100 antialiased selection:bg-blue-600 selection:text-white flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
