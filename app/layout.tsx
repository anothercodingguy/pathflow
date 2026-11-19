import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import { Inter, JetBrains_Mono } from 'next/font/google';

// next/font downloads the fonts at build time and serves them from this app
// (no request to Google from the browser). Each font is exposed as a CSS
// variable that tailwind.config.js uses for `font-sans` and `font-mono`.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'PathFlow | DevTools for AI Agents',
  description: 'Full-width IDE trace inspector, Flame Graphs, Timelines, Critical Path Highlighting, and GitHub PR-style run diffing for AI agents.',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script below may swap `dark` for `light` before React hydrates,
    // so the class list can legitimately differ from the server render.
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('pathflow_theme')==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}` }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased flex flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-accent-strong focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1 w-full min-w-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
