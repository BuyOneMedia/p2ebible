import { Shield, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

type RiskLevel = 'safe' | 'moderate' | 'high_risk' | 'scam';

const config: Record<RiskLevel, {
  label: string;
  className: string;
  Icon: React.ElementType;
}> = {
  safe:      { label: 'Safe',      className: 'badge-safe',     Icon: CheckCircle },
  moderate:  { label: 'Moderate',  className: 'badge-moderate', Icon: Shield },
  high_risk: { label: 'High Risk', className: 'badge-high',     Icon: AlertTriangle },
  scam:      { label: 'SCAM',      className: 'badge-scam',     Icon: AlertOctagon },
};

interface Props {
  level: RiskLevel | null | undefined;
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export default function RiskBadge({ level, score, size = 'md', showScore = false }: Props) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#2a2a3e] bg-[#111118] text-[#888899] text-xs font-mono">
        Unanalyzed
      </span>
    );
  }

  const { label, className, Icon } = config[level];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded border font-mono font-semibold ${className} ${sizeClasses[size]}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {label}
      {showScore && score !== null && score !== undefined && (
        <span className="opacity-70 ml-0.5">({score})</span>
      )}
    </span>
  );
}
