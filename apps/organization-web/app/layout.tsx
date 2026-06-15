import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

import QueryProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Resqconnect | Organization Portal',
    template: '%s | Resqconnect Org',
  },
  description:
    'Resqconnect Organization Portal | manage your emergency responders, track incidents in real time, and coordinate rescue operations across your service area.',
  applicationName: 'Resqconnect',
  keywords: [
    'emergency response',
    'rescue management',
    'incident tracking',
    'resqconnect',
    'organization portal',
  ],
  authors: [{ name: 'Resqconnect' }],
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Resqconnect | Organization Portal',
    description:
      'Manage emergency responders, track incidents, and coordinate rescue operations.',
    siteName: 'Resqconnect',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '2px',
                  fontFamily: "'Geist', sans-serif",
                  fontSize: '13px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
