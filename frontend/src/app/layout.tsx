import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:5173'),
  title: { default: 'URMovieRates', template: '%s · URMovieRates' },
  description: 'Descubra, avalie e compartilhe suas opiniões sobre filmes.',
  openGraph: {
    type: 'website',
    siteName: 'URMovieRates',
    locale: 'pt_BR',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#0f172a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
