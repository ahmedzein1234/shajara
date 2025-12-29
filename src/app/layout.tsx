import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shajara - شجرة | Arabic Family Tree',
  description: 'Build and preserve your family heritage with beautiful Arabic family trees - التطبيق العربي الأول لحفظ تاريخ عائلتك',
  keywords: ['family tree', 'شجرة العائلة', 'genealogy', 'Arabic', 'heritage'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'شجرة',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Shajara - شجرة',
    title: 'Shajara - شجرة | Arabic Family Tree',
    description: 'Build and preserve your family heritage with beautiful Arabic family trees',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shajara - شجرة',
    description: 'Arabic-first family tree app',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#064e3b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
