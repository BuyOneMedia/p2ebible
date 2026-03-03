'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Shield, Gamepad2, Home, Settings } from 'lucide-react';

const nav = [
  { href: '/',            label: 'Home',       icon: Home },
  { href: '/games',       label: 'Games',      icon: Gamepad2 },
  { href: '/scam-radar',  label: 'Scam Radar', icon: Shield },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e1e2e] bg-[#0a0a0f]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="P2E Bible"
              width={160}
              height={40}
              priority
              className="h-10 w-auto object-contain group-hover:drop-shadow-[0_0_12px_rgba(0,255,136,0.4)] transition-all duration-300"
            />
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/' && path.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                      : 'text-[#888899] hover:text-[#e2e2e2] hover:bg-[#111118]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Admin link (subtle) */}
            <Link
              href="/admin"
              className="ml-2 p-2 rounded-lg text-[#888899] hover:text-[#e2e2e2] hover:bg-[#111118] transition-all"
              title="Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
