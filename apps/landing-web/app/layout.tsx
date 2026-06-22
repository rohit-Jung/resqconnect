import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Geist, Geist_Mono } from 'next/font/google';

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
    default: 'ResQConnect — Emergency Response Platform',
    template: '%s | ResQConnect',
  },
  description:
    'Instantly connect to emergency responders, medical professionals, and loved ones with a single tap. Trusted by 500+ organizations across Nepal.',
  applicationName: 'ResQConnect',
  keywords: [
    'emergency response',
    'rescue management',
    'incident tracking',
    'emergency app',
    'Nepal emergency',
    'resqconnect',
  ],
  authors: [{ name: 'ResQConnect' }],
  openGraph: {
    title: 'ResQConnect — Emergency Response Platform',
    description:
      'Instantly connect to emergency responders with a single tap. Trusted by 500+ organizations.',
    siteName: 'ResQConnect',
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
