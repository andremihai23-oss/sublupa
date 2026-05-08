import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SubLupa',
  description: 'Modern sports & media blog',
  metadataBase: new URL('https://sublupa.com'),
  openGraph: {
    title: 'SubLupa',
    description: 'Modern sports & media blog',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
