import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScanToPrint • Instant Wireless Counter Printing Software',
  description: 'ScanToPrint allows xerox and print shops to offer direct wireless customer printing via QR code. Fast, private, and automated document printing.',
  keywords: [
    'scantoprint',
    'scan to print',
    'scantoprint in',
    'wireless counter printing',
    'xerox shop print software',
    'qr code printing shop',
    'instant document print counter',
    'counter print software india'
  ],
  metadataBase: new URL('https://scantoprint.in'),
  alternates: {
    canonical: 'https://scantoprint.in',
  },
  openGraph: {
    title: 'ScanToPrint • Wireless Counter Printing Software',
    description: 'Direct wireless customer printing via QR code for print shops.',
    url: 'https://scantoprint.in',
    siteName: 'ScanToPrint',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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