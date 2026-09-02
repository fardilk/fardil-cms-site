import React from 'react';
import Button from '../atoms/Button';

type Props<T> = {
  title: string;
  help?: string;
  addLabel: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** A fresh, empty row. */
  blank: () => T;
  /** Short text for the collapsed header, so a long list stays scannable. */
  summary: (item: T, index: number) => string;
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
};

/**
 * One editor for every repeating group on a service page. Order is what the
 * site renders, so moving a row is a first-class action rather than something
 * the editor has to fake by retyping.
 */
function RepeatableList<T>({
  title,
  help,
  addLabel,
  items,
  onChange,
  blank,
  summary,
  children,
}: Props<T>) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const update = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpenIndex(target);
  };

  const add = () => {
    onChange([...items, blank()]);
    setOpenIndex(items.length);
  };

  return (
    <section className="p-card">
      <div className="border-b border-[var(--p-border)] px-4 py-3">
        <h2 className="text-[0.8125rem] font-semibold text-[var(--p-text)]">
          {title}
          <span className="ml-2 font-normal text-[var(--p-text-secondary)]">{items.length}</span>
        </h2>
        {help && <p className="mt-0.5 text-xs text-[var(--p-text-secondary)]">{help}</p>}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
          Belum ada isian.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--p-border)]">
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <li key={index}>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : index)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="w-5 shrink-0 text-xs text-[var(--p-text-disabled)]">
                      {index + 1}
                    </span>
                    <span className="truncate text-[0.8125rem] text-[var(--p-text)]">
                      {summary(item, index) || <em className="text-[var(--p-text-disabled)]">Belum diisi</em>}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Naikkan"
                      className="h-7 w-7 rounded-md text-[var(--p-text-secondary)] hover:bg-[#f1f1f1] disabled:opacity-30"
                    >
                      <i className="fa fa-arrow-up text-xs" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Turunkan"
                      className="h-7 w-7 rounded-md text-[var(--p-text-secondary)] hover:bg-[#f1f1f1] disabled:opacity-30"
                    >
                      <i className="fa fa-arrow-down text-xs" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Hapus"
                      className="h-7 w-7 rounded-md text-[var(--p-critical)] hover:bg-[#ffd6d6]"
                    >
                      <i className="fa fa-trash text-xs" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-[var(--p-border)] bg-[#fafafa] px-4 py-4">
                    {children(item, (patch) => update(index, patch), index)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[var(--p-border)] px-4 py-3">
        <Button type="button" icon="fa-plus" onClick={add}>
          {addLabel}
        </Button>
      </div>
    </section>
  );
}

export default RepeatableList;
