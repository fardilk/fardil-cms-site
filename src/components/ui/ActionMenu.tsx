import React from 'react';

export type MenuAction = {
  label: string;
  icon?: string;
  href?: string;
  onSelect?: () => void;
  /** Renders in the critical colour, for anything destructive. */
  danger?: boolean;
};

/**
 * The three-dot overflow menu used on list rows. Closes on outside click and on
 * Escape, so it cannot be left hanging over the page.
 */
const ActionMenu: React.FC<{ actions: MenuAction[]; label?: string }> = ({
  actions,
  label = 'Aksi lain',
}) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass = (danger?: boolean) =>
    `flex w-full items-center gap-2 px-3 py-1.5 text-left text-[0.8125rem] hover:bg-[#f1f1f1] ${
      danger ? 'text-[var(--p-critical)]' : 'text-[var(--p-text)]'
    }`;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          // Rows are often links; the menu must not navigate them.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--p-border)] bg-white text-[var(--p-text-secondary)] shadow-sm hover:bg-[var(--p-surface-hover)]"
      >
        <i className="fa fa-ellipsis text-xs" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--p-border)] bg-white py-1 shadow-lg"
        >
          {actions.map((action) =>
            action.href ? (
              <a
                key={action.label}
                role="menuitem"
                href={action.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className={itemClass(action.danger)}
              >
                {action.icon && <i className={`fa ${action.icon} w-4 text-center text-xs`} aria-hidden="true" />}
                {action.label}
              </a>
            ) : (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  action.onSelect?.();
                }}
                className={itemClass(action.danger)}
              >
                {action.icon && <i className={`fa ${action.icon} w-4 text-center text-xs`} aria-hidden="true" />}
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
