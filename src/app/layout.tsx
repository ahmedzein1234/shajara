import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shajara - شجرة | Arabic Family Tree',
  description: 'Build and preserve your family heritage with beautiful Arabic family trees',
  keywords: ['family tree', 'شجرة العائلة', 'genealogy', 'Arabic', 'heritage'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
