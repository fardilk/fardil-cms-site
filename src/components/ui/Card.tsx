import React from 'react';

type CardProps = {
  title?: React.ReactNode;
  /** Rendered on the title row, right aligned: an icon button or a link. */
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Drop the inner padding when the card holds a full-bleed table or list. */
  flush?: boolean;
};

const Card: React.FC<CardProps> = ({ title, action, children, className = '', flush = false }) => (
  <section className={`p-card ${className}`}>
    {(title || action) && (
      <div className={`flex items-center justify-between gap-3 ${flush ? 'px-4 pt-4 pb-3' : 'px-4 pt-4'}`}>
        {typeof title === 'string' ? (
          <h2 className="text-[0.8125rem] font-semibold text-[var(--p-text)]">{title}</h2>
        ) : (
          title
        )}
        {action}
      </div>
    )}
    <div className={flush ? '' : 'p-4'}>{children}</div>
  </section>
);

export default Card;
