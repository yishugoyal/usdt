import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RupeeBridge | Advanced Institutional USDT → INR Sell-to-Company Platform',
  description: 'RupeeBridge is a direct company counterparty settlement platform allowing verified users to sell USDT for INR transferred straight to their verified bank accounts.',
  keywords: 'USDT to INR, Sell USDT India, Institutional Crypto Liquidation, Bank Payout USDT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-text antialiased`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
