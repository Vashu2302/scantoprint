import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://scantoprint.in'),
  title: {
    default: 'ScanToPrint • Instant Wireless Counter Printing Software',
    template: '%s • ScanToPrint',
  },
  description:
    'ScanToPrint is India\'s #1 automated wireless counter printing software for photocopy and stationery shops. Customers scan counter QR, upload documents, pay directly via UPI, and prints dispatch automatically without WhatsApp clutter.',
  keywords: [
    // Brand Variations (Top Priority for Google Search)
    'ScanToPrint',
    'Scan To Print',
    'scantoprint.in',
    'scantoprint portal',
    'scantoprint login',
    'scantoprint software',
    'scantoprint counter',
    
    // Core Business & Problem Solving
    'zerox shop software',
    'photocopy shop counter software',
    'wireless printing software',
    'counter qr printing',
    'automated print desk',
    'whatsapp print alternative',
    'usb printer spooler software',
    'instant print counter',
    'direct upi print kiosk',
    'smart printing desk for xerox',
    'touchless document printing',
    'stationery shop print automation',
    'cyber cafe print software',
    'student document print counter',
    'wireless print receiver software',
    'direct counter print spooler',
    'online document printing counter',
    'pdf print counter qr code',
    'automatic desktop spooler agent',
    'scantoprint merchant dashboard'
  ],
  authors: [{ name: 'ScanToPrint Team', url: 'https://scantoprint.in' }],
  creator: 'ScanToPrint',
  publisher: 'ScanToPrint',
  applicationName: 'ScanToPrint',
  category: 'Business Technology & Office Automation',
  alternates: {
    canonical: 'https://scantoprint.in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://scantoprint.in',
    siteName: 'ScanToPrint',
    title: 'ScanToPrint • Instant Wireless Counter Printing Software',
    description:
      'Zero-touch document printing for photocopy counters. Save 15-20 minutes every hour. 100% WhatsApp clutter free with direct UPI settlements.',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'ScanToPrint Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScanToPrint • Wireless Counter Printing',
    description:
      'Automate your printing desk. Customers scan QR, upload files, pay via UPI, and prints roll out instantly.',
    images: ['/icon.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Google Structured Data (JSON-LD) - This tells Google explicitly that your brand is ScanToPrint
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://scantoprint.in/#organization',
        name: 'ScanToPrint',
        url: 'https://scantoprint.in',
        logo: 'https://scantoprint.in/icon.svg',
        description: 'Automated wireless counter printing software for retail photocopy and print shops in India.',
        sameAs: ['https://scantoprint.in'],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ScanToPrint',
        operatingSystem: 'Windows, Web, Android, iOS',
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: '149',
          priceCurrency: 'INR',
        },
        description:
          'Software enabling customers to scan counter QR codes to upload documents and print silently to shop printers with instant UPI payment.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://scantoprint.in/#website',
        url: 'https://scantoprint.in',
        name: 'ScanToPrint',
        publisher: {
          '@id': 'https://scantoprint.in/#organization',
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* Google Bot Schema Insertion */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased bg-[#060813] text-slate-100">
        {children}
      </body>
    </html>
  );
}