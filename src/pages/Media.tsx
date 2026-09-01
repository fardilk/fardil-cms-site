import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import ImageWithFallback from '../components/atoms/ImageWithFallback';
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
    <GlobalLayout>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Media</h1>
            {usage && (
              <p className="text-sm text-gray-500 mt-1">
                {usage.file_count} berkas &middot; {formatBytes(usage.used_bytes)}
                {usage.quota_bytes > 0 && <> dari {formatBytes(usage.quota_bytes)}</>}
              </p>
            )}
          </div>
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => void upload(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <i className={`fa ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'} mr-2`} aria-hidden="true" />
              {uploading ? 'Mengunggah…' : 'Unggah gambar'}
            </button>
          </div>
        </div>

        {usage && usage.quota_bytes > 0 && (
          <div className="mb-6">
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full ${pct > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{pct}% terpakai</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Memuat…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-images text-5xl text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-600 font-medium">Belum ada gambar</p>
            <p className="text-gray-400 text-sm">Unggah gambar untuk dipakai di artikel dan halaman layanan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.asset.id} className="border border-gray-200 rounded-lg overflow-hidden group">
                <ImageWithFallback
                  src={imageURL(item.url)}
                  alt={item.asset.original_name}
                  className="w-full h-28 object-cover bg-gray-50"
                />
                <div className="p-2">
                  <p className="text-xs text-gray-700 truncate" title={item.asset.original_name}>
                    {item.asset.original_name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {item.asset.width}×{item.asset.height} &middot; {formatBytes(item.asset.size_bytes)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="mt-2 text-[11px] text-red-600 hover:underline"
                  >
                    <i className="fa fa-trash mr-1" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlobalLayout>
  );
};

export default Media;
