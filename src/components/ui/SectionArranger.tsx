import React from 'react';
import Card from './Card';
import Button from '../atoms/Button';
import { TextField, TextArea, SelectField, Toggle } from './Field';
import { SECTION_META, TONES } from '@/lib/pageSections';
import type { SectionSetting } from '@/lib/pageSections';

/**
 * Arranges the bands of a service page.
 *
 * Ordering is two buttons rather than drag and drop: a list of ten never needs
 * a long drag, the buttons work on a touch screen and with a keyboard, and
 * they cost none of the machinery a drag surface does.
 *
 * A band that is switched on but has nothing in it still renders as nothing —
 * the site hides an empty group either way. The switch is for hiding a band
 * that does have content.
 */

type Props = {
  value: SectionSetting[];
  onChange: (next: SectionSetting[]) => void;
  /** Which keys currently hold content, so the list can say what is empty. */
  filled: Partial<Record<string, boolean>>;
};

const move = (rows: SectionSetting[], from: number, to: number) => {
  if (to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
};

const SectionArranger: React.FC<Props> = ({ value, onChange, filled }) => {
  const [openKey, setOpenKey] = React.useState<string | null>(null);

  const update = (index: number, patch: Partial<SectionSetting>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <Card title="Susunan Halaman">
      <p className="mb-3 text-xs text-[var(--p-text-secondary)]">
        Urutan, judul dan warna latar tiap bagian di halaman publik.
      </p>
      <ul className="divide-y divide-[var(--p-border)]">
        {value.map((row, i) => {
          const meta = SECTION_META[row.key] ?? { label: row.key, help: '' };
          const open = openKey === row.key;
          const empty = row.key !== 'intro' && row.key !== 'cta' && !filled[row.key];

          return (
            <li key={row.key} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Naikkan ${meta.label}`}
                    disabled={i === 0}
                    onClick={() => onChange(move(value, i, i - 1))}
                    className="px-1 text-[0.7rem] text-[var(--p-text-secondary)] hover:text-[var(--p-text)] disabled:opacity-30"
                  >
                    <i className="fa fa-chevron-up" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan ${meta.label}`}
                    disabled={i === value.length - 1}
                    onClick={() => onChange(move(value, i, i + 1))}
                    className="px-1 text-[0.7rem] text-[var(--p-text-secondary)] hover:text-[var(--p-text)] disabled:opacity-30"
                  >
                    <i className="fa fa-chevron-down" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : row.key)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className={`block truncate text-[0.8125rem] font-medium ${
                      row.enabled ? 'text-[var(--p-text)]' : 'text-[var(--p-text-disabled)]'
                    }`}
                  >
                    {i + 1}. {row.title || meta.label}
                  </span>
                  <span className="block truncate text-xs text-[var(--p-text-secondary)]">
                    {empty ? 'Belum ada isi — tidak akan tampil' : meta.help}
                  </span>
                </button>

                <Toggle
                  label="Tampil"
                  checked={row.enabled}
                  onChange={(v) => update(i, { enabled: v })}
                />
              </div>

              {open && (
                <div className="mt-3 space-y-3 rounded-lg bg-[#fafafa] p-3">
                  <TextField
                    label="Judul di halaman"
                    hint="Kosongkan untuk memakai judul bawaan template."
                    value={row.title}
                    onChange={(v) => update(i, { title: v })}
                  />
                  <TextArea
                    label="Keterangan di bawah judul"
                    rows={2}
                    value={row.subtitle}
                    onChange={(v) => update(i, { subtitle: v })}
                  />
                  <SelectField
                    label="Warna latar"
                    hint="Otomatis membuat bagian berselang-seling supaya tidak menyatu."
                    value={row.tone}
                    onChange={(v) => update(i, { tone: v as SectionSetting['tone'] })}
                    options={TONES}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--p-text-secondary)]">
          Bagian tanpa isi otomatis disembunyikan di situs.
        </p>
        <Button
          onClick={() => onChange(value.map((row) => ({ ...row, enabled: true })))}
        >
          Tampilkan semua
        </Button>
      </div>
    </Card>
  );
};

export default SectionArranger;
