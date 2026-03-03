export const metadata = {
  title: 'Legal — P2E Bible',
  description: 'Terms of Service, Privacy Policy, FTC Affiliate Disclosure, Financial Disclaimer, and NFT Access Token Terms for P2E Bible.',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface LegalSection {
  id: string;
  title: string;
  emoji: string;
  content: React.ReactNode;
}

// ── Section content ───────────────────────────────────────────────────────────

const sections: LegalSection[] = [
  {
    id: 'tos',
    title: 'Terms of Service',
    emoji: '📋',
    content: (
      <div className="space-y-3 text-sm text-[#b0b0c0]">
        <p className="font-semibold text-[#e2e2e2]">Key Points</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>P2E Bible is operated by <strong>Buy One Media LLC</strong>, Dayton, Ohio.</li>
          <li>By accessing p2ebible.com you agree to these terms. If you do not agree, do not use the site.</li>
          <li>Content is provided for informational and educational purposes only. Nothing constitutes financial, legal, or investment advice.</li>
          <li>You must be at least 18 years old (or the age of majority in your jurisdiction) to use this site.</li>
          <li>You agree not to scrape, reverse-engineer, or attempt to disrupt site infrastructure.</li>
          <li>We reserve the right to modify, suspend, or terminate any feature of the site at any time without prior notice.</li>
          <li>All intellectual property — including the P2E Bible book content, AI analysis, and brand assets — belongs to Buy One Media LLC unless otherwise stated.</li>
          <li>User-generated content (forum posts, comments) remains the property of the user; by posting you grant us a non-exclusive licence to display it.</li>
          <li>These terms are governed by the laws of the State of Ohio, USA. Any disputes shall be resolved in the courts of Montgomery County, Ohio.</li>
          <li>We may update these terms at any time. Continued use constitutes acceptance of the revised terms.</li>
        </ul>
        <p className="text-[#555577]">For questions: <a href="mailto:legal@p2ebible.com" className="text-[#00ff88] hover:underline">legal@p2ebible.com</a></p>
      </div>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    emoji: '🔒',
    content: (
      <div className="space-y-3 text-sm text-[#b0b0c0]">
        <p className="font-semibold text-[#e2e2e2]">Key Points</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Data we collect:</strong> IP address, browser type, pages visited, and click events (via server-side logs). Email address if you subscribe or contact us. Wallet address only if you connect one voluntarily.</li>
          <li><strong>Data we do NOT collect:</strong> We do not store private keys, seed phrases, or any on-chain transaction data.</li>
          <li><strong>Cookies:</strong> We use essential cookies for session management. Analytics cookies (if any) are non-identifying and can be opted out of.</li>
          <li><strong>Affiliate tracking:</strong> When you click an affiliate link, the destination partner may set their own cookies. We are not responsible for third-party data practices.</li>
          <li><strong>Data sharing:</strong> We do not sell personal data. We may share anonymised, aggregated analytics with partners.</li>
          <li><strong>Data retention:</strong> Log data is retained for up to 90 days. Email data is retained until you unsubscribe.</li>
          <li><strong>Your rights:</strong> You may request access to, correction of, or deletion of your personal data at any time.</li>
          <li><strong>GDPR / CCPA:</strong> If you are a resident of the EU or California, you have additional rights under applicable law. Contact us to exercise them.</li>
          <li>We use industry-standard security measures but cannot guarantee absolute security.</li>
        </ul>
        <p className="text-[#555577]">Privacy requests: <a href="mailto:privacy@p2ebible.com" className="text-[#00ff88] hover:underline">privacy@p2ebible.com</a></p>
      </div>
    ),
  },
  {
    id: 'ftc',
    title: 'FTC Affiliate Disclosure',
    emoji: '💸',
    content: (
      <div className="space-y-3 text-sm text-[#b0b0c0]">
        <p className="font-semibold text-[#e2e2e2]">Key Points</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>P2E Bible participates in affiliate marketing programs. When you click certain links and make a qualifying purchase or sign-up, we may earn a commission.</li>
          <li>Affiliate relationships do not influence our editorial content. Games and tools are reviewed on merit regardless of whether an affiliate relationship exists.</li>
          <li>All affiliate links are routed through <code className="rounded bg-[#1a1a2e] px-1">/go/[id]</code> to track clicks transparently.</li>
          <li>Current affiliate partners may include (but are not limited to): Ledger, Binance, Coinbase, Amazon Associates, and various crypto exchanges and wallets.</li>
          <li>Commissions earned are reinvested into operating the AI Scam Radar, server infrastructure, and keeping the site free to access.</li>
          <li>This disclosure is made in accordance with the U.S. Federal Trade Commission guidelines (16 CFR Part 255) and equivalent international regulations.</li>
          <li>For a complete list of our affiliate partnerships, see the <a href="/resources" className="text-[#00ff88] hover:underline">Resources page</a>.</li>
        </ul>
        <p className="text-[#555577]">Affiliate inquiries: <a href="mailto:legal@p2ebible.com" className="text-[#00ff88] hover:underline">legal@p2ebible.com</a></p>
      </div>
    ),
  },
  {
    id: 'financial',
    title: 'Financial Disclaimer',
    emoji: '⚠️',
    content: (
      <div className="space-y-3 text-sm text-[#b0b0c0]">
        <p className="font-semibold text-[#e2e2e2]">Key Points</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Not financial advice.</strong> Nothing on p2ebible.com constitutes financial, investment, tax, or legal advice.</li>
          <li>Cryptocurrency and blockchain-based assets (including NFTs and in-game tokens) are highly speculative and volatile. You may lose some or all of your investment.</li>
          <li>Past performance of any game, token, or strategy is not indicative of future results.</li>
          <li>Our AI risk scores are analytical tools only — they are not guarantees of safety or profitability. Always conduct your own due diligence (DYOR).</li>
          <li>Play-to-earn income is not guaranteed. Game economies can collapse, projects can be abandoned, and smart contracts can contain bugs.</li>
          <li>Buy One Media LLC and its employees may hold positions in assets mentioned on this site. Such holdings are disclosed where material.</li>
          <li>Consult a qualified financial adviser before making investment decisions.</li>
          <li>Regulatory status of crypto assets varies by jurisdiction. It is your responsibility to ensure compliance with local laws.</li>
        </ul>
        <p className="mt-2 font-semibold text-[#ff4444]">
          NEVER invest more than you can afford to lose entirely.
        </p>
      </div>
    ),
  },
  {
    id: 'nft',
    title: 'NFT Access Token Terms',
    emoji: '🎫',
    content: (
      <div className="space-y-3 text-sm text-[#b0b0c0]">
        <p className="font-semibold text-[#e2e2e2]">Key Points</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The P2E Bible NFT Access Token (when issued) grants the holder access to premium features on p2ebible.com for the lifetime of the platform.</li>
          <li>The NFT is a utility token only. It does not represent equity, ownership, profit-sharing rights, or any financial instrument.</li>
          <li>Token holders receive access to: premium game analysis, extended AI Scam Radar history, downloadable data exports, and early access to new features.</li>
          <li>Access is non-transferable to third parties while the token is staked/locked in a P2E Bible access vault. Transfer of the NFT itself transfers access rights.</li>
          <li>Buy One Media LLC reserves the right to modify, expand, or limit premium features at any time, with 30 days notice to token holders.</li>
          <li>Token holders are responsible for maintaining the security of their own wallets. Lost access due to lost private keys cannot be recovered by us.</li>
          <li>The NFT does not guarantee the continued operation of p2ebible.com. In the event the site closes, no refund or compensation is implied.</li>
          <li>Secondary market sales of the NFT are subject to applicable tax laws in your jurisdiction.</li>
          <li>These terms are in addition to the general Terms of Service above and take precedence for NFT-specific matters.</li>
        </ul>
        <p className="text-[#555577]">NFT support: <a href="mailto:legal@p2ebible.com" className="text-[#00ff88] hover:underline">legal@p2ebible.com</a></p>
      </div>
    ),
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <div id={section.id} className="scroll-mt-24">
      <details className="group rounded-xl border border-[#1e1e2e] bg-[#0d0d18] open:border-[#00ff88]/30">
        <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 marker:content-['']">
          <div className="flex items-center gap-3">
            <span className="text-xl">{section.emoji}</span>
            <h2 className="font-semibold text-[#e2e2e2] group-open:text-[#00ff88]">
              {section.title}
            </h2>
          </div>
          {/* Chevron */}
          <svg
            className="h-4 w-4 shrink-0 text-[#555577] transition-transform group-open:rotate-180 group-open:text-[#00ff88]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="border-t border-[#1e1e2e] px-5 pb-5 pt-4">{section.content}</div>
      </details>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-16">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#e2e2e2]">
            Legal <span className="text-[#00ff88]">Documents</span>
          </h1>
          <p className="text-[#888899]">
            Buy One Media LLC · Dayton, Ohio
          </p>
        </div>

        {/* Pending review notice */}
        <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-4 text-sm text-yellow-300">
          <p>
            <strong>Notice:</strong> These documents are pending attorney review. Effective date:{' '}
            <span className="font-mono">[TBD on launch]</span>. The summaries below represent the
            current operational intent of each policy.
          </p>
        </div>

        {/* Table of Contents */}
        <nav
          aria-label="Legal sections"
          className="mb-10 rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#555577]">
            Contents
          </p>
          <ol className="space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-[#8888aa] transition-colors hover:text-[#00ff88]"
                >
                  <span className="w-5 text-center text-xs text-[#555577]">{i + 1}.</span>
                  <span>{s.emoji}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>

        {/* Contact footer */}
        <div className="mt-12 rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-5 text-sm text-[#888899]">
          <p className="mb-2 font-semibold text-[#e2e2e2]">Contact</p>
          <div className="flex flex-col gap-1">
            <p>
              General legal:{' '}
              <a href="mailto:legal@p2ebible.com" className="text-[#00ff88] hover:underline">
                legal@p2ebible.com
              </a>
            </p>
            <p>
              Privacy requests:{' '}
              <a href="mailto:privacy@p2ebible.com" className="text-[#00ff88] hover:underline">
                privacy@p2ebible.com
              </a>
            </p>
            <p className="mt-2 text-[#555577]">Buy One Media LLC · Dayton, Ohio, USA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
