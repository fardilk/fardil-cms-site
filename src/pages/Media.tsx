import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import ImageWithFallback from '../components/atoms/ImageWithFallback';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/atoms/Button';
import { apiFetch, imageURL } from '@/lib/api';

type Asset = {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  created_at: string;
};

type MediaItem = { asset: Asset; url: string };

type Usage = { used_bytes: number; quota_bytes: number; file_count: number };

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const Media = () => {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [usage, setUsage] = React.useState<Usage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [mediaRes, usageRes] = await Promise.all([
        apiFetch('/api/media', { credentials: 'include' }),
        apiFetch('/api/media/usage', { credentials: 'include' }),
      ]);
      if (mediaRes.ok) setItems(await mediaRes.json());
      if (usageRes.ok) setUsage(await usageRes.json());
    } catch {
      toast.error('Gagal memuat media');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        const res = await apiFetch('/api/media', { method: 'POST', body, credentials: 'include' });
        if (!res.ok) {
          // The API reports a full store and an unsupported type with readable
          // messages; surface those instead of a generic failure.
          const { error } = await res.json().catch(() => ({ error: '' }));
          toast.error(error || `Gagal mengunggah ${file.name}`);
          continue;
        }
        toast.success(`${file.name} terunggah`);
      }
      await load();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const remove = async (item: MediaItem) => {
    const res = await apiFetch(`/api/media/${item.asset.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error('Gagal menghapus');
      return;
    }
    toast.success('Terhapus');
    await load();
  };

  const pct = usage && usage.quota_bytes > 0
    ? Math.min(100, Math.round((usage.used_bytes / usage.quota_bytes) * 100))
    : 0;

  return (
    <GlobalLayout wide>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      <PageHeader
        title="Media"
        subtitle={
          usage
            ? `${usage.file_count} berkas · ${formatBytes(usage.used_bytes)}${usage.quota_bytes > 0 ? ` dari ${formatBytes(usage.quota_bytes)}` : ''}`
            : undefined
        }
        actions={
          <Button
            variant="primary"
            disabled={uploading}
            icon={uploading ? 'fa-spinner fa-spin' : 'fa-upload'}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? 'Mengunggah…' : 'Unggah gambar'}
          </Button>
        }
      />
      <Card>

        {usage && usage.quota_bytes > 0 && (
          <div className="mb-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e3e3e3]">
              <div
                className={`h-full ${pct > 90 ? 'bg-[#c62828]' : 'bg-[#303030]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--p-text-secondary)]">{pct}% terpakai</p>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-images mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
            <p className="font-medium text-[var(--p-text)]">Belum ada gambar</p>
            <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
              Unggah gambar untuk dipakai di artikel dan halaman layanan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.asset.id} className="overflow-hidden rounded-lg border border-[var(--p-border)]">
                <ImageWithFallback
                  src={imageURL(item.url)}
                  alt={item.asset.original_name}
                  className="h-28 w-full bg-[#fafafa] object-cover"
                />
                <div className="p-2">
                  <p className="truncate text-xs text-[var(--p-text)]" title={item.asset.original_name}>
                    {item.asset.original_name}
                  </p>
                  <p className="text-[11px] text-[var(--p-text-secondary)]">
                    {item.asset.width}×{item.asset.height} &middot; {formatBytes(item.asset.size_bytes)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="mt-2 text-[11px] text-[var(--p-critical)] hover:underline"
                  >
                    <i className="fa fa-trash mr-1" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </GlobalLayout>
  );
};

export default Media;
