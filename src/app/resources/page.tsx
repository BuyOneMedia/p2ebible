import { getDb } from '@/lib/db';
import type { AffiliateLink } from '@/lib/db';
import { ExternalLink, AlertCircle } from 'lucide-react';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resources — P2E Bible',
  description:
    'The live appendix to the P2E Bible book. Curated wallets, exchanges, NFT marketplaces, analytics tools, tax software, and more for Web3 gamers.',
};

// ── Category config ───────────────────────────────────────────────────────────

interface CategoryConfig {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'wallet',
    label: 'Wallets',
    emoji: '👛',
    description: 'Hardware and software wallets for safely storing your crypto and NFTs.',
  },
  {
    key: 'exchange',
    label: 'Exchanges',
    emoji: '💱',
    description: 'Centralised (CEX) and decentralised (DEX) venues for trading tokens.',
  },
  {
    key: 'nft_marketplace',
    label: 'NFT Marketplaces',
    emoji: '🖼️',
    description: 'Buy, sell, and discover in-game NFTs and digital collectibles.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    emoji: '📊',
    description: 'On-chain data, portfolio trackers, and market intelligence.',
  },
  {
    key: 'tax',
    label: 'Tax & Accounting',
    emoji: '🧾',
    description: 'Calculate your crypto gains, losses, and tax obligations.',
  },
  {
    key: 'security',
    label: 'Security Tools',
    emoji: '🔐',
    description: 'Protect your assets — VPNs, hardware keys, wallet auditors.',
  },
  {
    key: 'game_research',
    label: 'Game Research',
    emoji: '🕹️',
    description: 'Discover and evaluate new play-to-earn and Web3 games.',
  },
  {
    key: 'learning',
    label: 'Learning',
    emoji: '📚',
    description: 'Courses, guides, and communities for levelling up your Web3 knowledge.',
  },
  {
    key: 'community',
    label: 'Community',
    emoji: '💬',
    description: 'Discord servers, forums, and Telegram groups for P2E players.',
  },
  {
    key: 'career',
    label: 'Career',
    emoji: '💼',
    description: 'Job boards, freelance platforms, and tools for Web3 professionals.',
  },
];

// ── Data fetching ─────────────────────────────────────────────────────────────

function getLinksGrouped(): Record<string, AffiliateLink[]> {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT * FROM affiliate_links WHERE is_active = 1 ORDER BY partner_category, display_name`
      )
      .all() as AffiliateLink[];

    const grouped: Record<string, AffiliateLink[]> = {};
    for (const row of rows) {
      const cat = row.partner_category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }
    return grouped;
  } catch {
    // DB not yet initialised (e.g. during build or first boot)
    return {};
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FtcDisclosure() {
  return (
    <div className="flex gap-3 rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 p-4 text-sm text-[#b0b0c0]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#00ff88]" />
      <p>
        <span className="font-semibold text-[#00ff88]">AFFILIATE DISCLOSURE: </span>
        Some links on this page are affiliate links. If you click a link and make a purchase, we may
        earn a commission at no additional cost to you. We only recommend tools that provide genuine
        value to Web3 gamers. Commissions help fund the AI Scam Radar and keep p2ebible.com free.
      </p>
    </div>
  );
}

function LinkCard({ link }: { link: AffiliateLink }) {
  const affiliateHref = `/go/${link.id}`;

  return (
    <a
      href={affiliateHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex flex-col gap-2 rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-4 transition-all duration-200 hover:border-[#00ff88]/40 hover:bg-[#0d0d18]/80 hover:shadow-[0_0_12px_rgba(0,255,136,0.08)]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-[#e2e2e2] group-hover:text-[#00ff88] transition-colors">
          {link.display_name}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-[#555577] group-hover:text-[#00ff88] transition-colors" />
      </div>

      {/* Destination URL — displayed for transparency */}
      <span className="truncate text-xs text-[#555577]">{link.destination_url}</span>

      {/* Partner badge */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className="rounded-full bg-[#1a1a2e] px-2 py-0.5 text-xs text-[#8888aa]">
          {link.partner}
        </span>
        {link.click_count > 0 && (
          <span className="text-xs text-[#555577]">{link.click_count.toLocaleString()} clicks</span>
        )}
      </div>
    </a>
  );
}

function CategorySection({
  config,
  links,
}: {
  config: CategoryConfig;
  links: AffiliateLink[];
}) {
  if (links.length === 0) return null;

  return (
    <section id={config.key} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <h2 className="text-xl font-bold text-[#e2e2e2]">{config.label}</h2>
          <p className="text-sm text-[#666688]">{config.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const grouped = getLinksGrouped();
  const totalLinks = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-16">
      <div className="mx-auto max-w-6xl">

        {/* Page header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#e2e2e2]">
            P2E Bible{' '}
            <span className="text-[#00ff88]">Resource Hub</span>
          </h1>
          <p className="mx-auto max-w-2xl text-[#888899]">
            The live appendix to the book. Every tool below is hand-curated for Web3 gamers.
            Updated continuously — bookmark this page instead of the static PDF.
          </p>
          {totalLinks > 0 && (
            <p className="mt-2 text-sm text-[#555577]">
              {totalLinks} active resource{totalLinks !== 1 ? 's' : ''} across{' '}
              {Object.keys(grouped).length} categor{Object.keys(grouped).length !== 1 ? 'ies' : 'y'}
            </p>
          )}
        </div>

        {/* FTC Disclosure */}
        <div className="mb-8">
          <FtcDisclosure />
        </div>

        {/* Table of Contents */}
        {totalLinks > 0 && (
          <nav
            aria-label="Jump to category"
            className="mb-12 rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#555577]">
              Jump to section
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => (grouped[c.key] || []).length > 0).map((cat) => (
                <a
                  key={cat.key}
                  href={`#${cat.key}`}
                  className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-1.5 text-sm text-[#8888aa] transition-colors hover:border-[#00ff88]/40 hover:text-[#00ff88]"
                >
                  {cat.emoji} {cat.label}
                  <span className="ml-1.5 text-xs text-[#555577]">
                    ({(grouped[cat.key] || []).length})
                  </span>
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Category sections */}
        {totalLinks === 0 ? (
          <div className="rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-12 text-center text-[#555577]">
            <p className="text-lg">Resources are being loaded.</p>
            <p className="mt-1 text-sm">Check back shortly — the admin is populating this list.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.key}
                config={cat}
                links={grouped[cat.key] || []}
              />
            ))}

            {/* Catch-all for categories not in CATEGORIES config */}
            {Object.entries(grouped)
              .filter(([key]) => !CATEGORIES.find((c) => c.key === key))
              .map(([key, links]) => (
                <CategorySection
                  key={key}
                  config={{
                    key,
                    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                    emoji: '🔗',
                    description: '',
                  }}
                  links={links}
                />
              ))}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-16 border-t border-[#1e1e2e] pt-8 text-center text-sm text-[#555577]">
          <p>
            Missing a tool? Email{' '}
            <a href="mailto:resources@p2ebible.com" className="text-[#00ff88] hover:underline">
              resources@p2ebible.com
            </a>
            . Partner inquiries welcome.
          </p>
        </div>
      </div>
    </div>
  );
}
