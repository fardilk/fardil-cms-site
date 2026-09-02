import React from 'react';

type Props = {
  title: string;
  /** Status pills shown inline after the title. */
  badges?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Back arrow target, rendered as a round icon button like Shopify's. */
  onBack?: () => void;
};

const PageHeader: React.FC<Props> = ({ title, badges, subtitle, actions, onBack }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div className="flex items-start gap-2 min-w-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          className="mt-0.5 h-7 w-7 shrink-0 rounded-lg border border-[var(--p-border)] bg-white text-[var(--p-text-secondary)] hover:bg-[var(--p-surface-hover)]"
        >
          <i className="fa fa-chevron-left text-xs" aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--p-text)] truncate">{title}</h1>
          {badges}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[0.8125rem] text-[var(--p-text-secondary)]">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
