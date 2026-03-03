import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'P2E Bible — Your Web3 Gaming Companion',
  description: 'The living companion to the P2E Bible book. AI-powered game discovery, real-time scam radar, and daily-updated resources for Web3 gamers.',
  keywords: ['play to earn', 'P2E', 'web3 gaming', 'crypto games', 'NFT games', 'GameFi', 'scam radar'],
  openGraph: {
    title: 'P2E Bible — AI-Powered Web3 Gaming Intelligence',
    description: 'Scout new games. Detect scams before they rug you. Earn more — smarter.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0f] text-[#e2e2e2]`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-[#1e1e2e] mt-20 py-10 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#888899]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff88] font-bold">P2E Bible</span>
              <span>— A Buy One Media property</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://earnhq.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#e2e2e2] transition-colors">
                EarnHQ Partner Network ↗
              </a>
              <span>·</span>
              <a href="/admin" className="hover:text-[#e2e2e2] transition-colors">Admin</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
