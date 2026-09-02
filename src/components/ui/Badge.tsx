import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

const tones: Record<Tone, { bg: string; dot: string; text: string }> = {
  neutral: { bg: 'bg-[#e3e3e3]', dot: 'bg-[#616161]', text: 'text-[#303030]' },
  success: { bg: 'bg-[#cdfee1]', dot: 'bg-[#29845a]', text: 'text-[#0c5132]' },
  warning: { bg: 'bg-[#ffd6a4]', dot: 'bg-[#996a13]', text: 'text-[#5e4200]' },
  critical: { bg: 'bg-[#ffd6d6]', dot: 'bg-[#c62828]', text: 'text-[#8e1f0b]' },
  info: { bg: 'bg-[#d3f0ff]', dot: 'bg-[#0094d5]', text: 'text-[#00527c]' },
};

/** Small status pill. `dot` mirrors Shopify's Paid/Fulfilled markers. */
const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: React.ReactNode }> = ({
  tone = 'neutral',
  dot = false,
  children,
}) => {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium ${t.bg} ${t.text}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
};

export default Badge;
