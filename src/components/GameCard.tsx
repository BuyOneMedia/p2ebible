import Link from 'next/link';
import { ExternalLink, Layers, Tag } from 'lucide-react';
import RiskBadge from './RiskBadge';

type RiskLevel = 'safe' | 'moderate' | 'high_risk' | 'scam';

interface Props {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  chain: string | null;
  genre: string | null;
  token_symbol: string | null;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  affiliate_link_id: number | null;
  is_featured: number;
}

export default function GameCard(props: Props) {
  const {
    slug, name, description, chain, genre,
    token_symbol, risk_level, risk_score,
    affiliate_link_id, is_featured
  } = props;

  return (
    <div className={`
      relative flex flex-col p-5 rounded-xl border bg-[#111118] card-hover
      ${is_featured ? 'border-[#00ff88]/30 shadow-neon' : 'border-[#1e1e2e]'}
    `}>
      {is_featured && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#00ff88] text-[#0a0a0f] text-[10px] font-bold rounded-full uppercase tracking-wider">
          Featured
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link href={`/games/${slug}`} className="font-bold text-[#e2e2e2] hover:text-[#00ff88] transition-colors line-clamp-1">
          {name}
        </Link>
        <RiskBadge level={risk_level} score={risk_score} showScore size="sm" />
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-[#888899] line-clamp-2 mb-3 flex-1">{description}</p>
      )}

      {/* Meta tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chain && (
          <span className="flex items-center gap-1 text-xs text-[#888899] bg-[#16161f] px-2 py-0.5 rounded border border-[#1e1e2e]">
            <Layers className="w-3 h-3" /> {chain}
          </span>
        )}
        {genre && (
          <span className="flex items-center gap-1 text-xs text-[#888899] bg-[#16161f] px-2 py-0.5 rounded border border-[#1e1e2e]">
            <Tag className="w-3 h-3" /> {genre}
          </span>
        )}
        {token_symbol && (
          <span className="text-xs text-[#7c3aed] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2 py-0.5 rounded font-mono">
            ${token_symbol}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="flex gap-2">
        <Link
          href={`/games/${slug}`}
          className="flex-1 text-center text-xs py-2 rounded-lg border border-[#2a2a3e] text-[#888899] hover:text-[#e2e2e2] hover:border-[#3a3a4e] transition-all"
        >
          Full Analysis
        </Link>
        {affiliate_link_id && (
          <Link
            href={`/go/${affiliate_link_id}`}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all font-medium"
            target="_blank"
          >
            Play Now <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
