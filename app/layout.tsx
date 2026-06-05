import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SnapBooth — Virtual Photo Booth',
  description:
    'Aplikasi photo booth virtual dengan background pilihan, filter foto, dan fitur cetak langsung.',
  keywords: ['photo booth', 'virtual photo booth', 'filter foto', 'snapbooth'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
