import React from 'react';
import ImageWithFallback from '../atoms/ImageWithFallback';
import Button from '../atoms/Button';
import { apiFetch, imageURL } from '@/lib/api';

type MediaItem = { asset: { id: number; original_name: string }; url: string };

/**
 * A media library that can be awaited: `pick()` resolves with the chosen path,
 * or null if the picker is dismissed. Blocks need that shape because inserting
 * an image is one step in a longer action.
 */
export function useMediaPicker() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const resolver = React.useRef<((url: string | null) => void) | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/media', { credentials: 'include' });
      setItems(res.ok ? await res.json() : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const settle = (url: string | null) => {
    resolver.current?.(url);
    resolver.current = null;
    setOpen(false);
  };

  const pick = React.useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        resolver.current = resolve;
        setOpen(true);
      }),
    [],
  );

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', files[0]);
      const res = await apiFetch('/api/media', { method: 'POST', body, credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      settle(data.url);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const modal = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
              <h3 className="text-[0.8125rem] font-semibold">Pustaka Media</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  icon={uploading ? 'fa-spinner fa-spin' : 'fa-upload'}
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? 'Mengunggah…' : 'Unggah baru'}
                </Button>
                <button
                  type="button"
                  onClick={() => settle(null)}
                  aria-label="Tutup"
                  className="h-7 w-7 rounded-md text-[var(--p-text-secondary)] hover:bg-[#f1f1f1]"
                >
                  <i className="fa fa-xmark" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="py-10 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
                  Belum ada gambar. Pakai tombol Unggah baru di atas.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.asset.id}
                      type="button"
                      onClick={() => settle(item.url)}
                      className="overflow-hidden rounded-lg border border-[var(--p-border)] text-left hover:border-[var(--p-border-strong)]"
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
    </>
  );

  return { pick, modal };
}
