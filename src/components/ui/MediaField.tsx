import React from 'react';
import ImageWithFallback from '../atoms/ImageWithFallback';
import Button from '../atoms/Button';
import { apiFetch, imageURL } from '@/lib/api';

type MediaItem = { asset: { id: number; original_name: string }; url: string };

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
};

/**
 * Picks an image from the media library. Typing a path by hand is exactly the
 * "you need to know the system" problem the panel exists to remove, so the
 * picker is part of any form that carries an image.
 */
const MediaField: React.FC<Props> = ({ label, hint, value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch('/api/media', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div>
      <span className="p-label">{label}</span>

      <div className="flex items-start gap-3">
        <ImageWithFallback
          src={value ? imageURL(value) : ''}
          alt=""
          className="h-16 w-24 shrink-0 rounded-lg border border-[var(--p-border)] object-cover"
          iconClassName="text-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button type="button" icon="fa-images" onClick={() => setOpen(true)}>
              Pilih gambar
            </Button>
            {value && (
              <Button type="button" variant="plain" onClick={() => onChange('')}>
                Hapus
              </Button>
            )}
          </div>
          {value && <p className="mt-1 truncate text-xs text-[var(--p-text-secondary)]">{value}</p>}
          {hint && <p className="mt-1 text-xs text-[var(--p-text-secondary)]">{hint}</p>}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
              <h3 className="text-[0.8125rem] font-semibold">Pustaka Media</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="h-7 w-7 rounded-md text-[var(--p-text-secondary)] hover:bg-[#f1f1f1]"
              >
                <i className="fa fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="py-10 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
                  Memuat…
                </p>
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
                  Belum ada gambar. Unggah dulu di menu Media.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.asset.id}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setOpen(false);
                      }}
                      className={`overflow-hidden rounded-lg border text-left ${
                        value === item.url
                          ? 'border-[#303030] ring-2 ring-[#303030]'
                          : 'border-[var(--p-border)] hover:border-[var(--p-border-strong)]'
                      }`}
                    >
                      <ImageWithFallback
                        src={imageURL(item.url)}
                        alt={item.asset.original_name}
                        className="h-20 w-full bg-[#fafafa] object-cover"
                      />
                      <span className="block truncate px-2 py-1 text-[11px] text-[var(--p-text-secondary)]">
                        {item.asset.original_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaField;
