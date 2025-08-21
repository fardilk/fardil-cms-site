import type { ContentBlock } from '@/components/func/contentBlocks';

// Minimal IndexedDB helpers for storing blobs as draft assets
const DB_NAME = 'fardil-cms-drafts';
const STORE = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBlob(key: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

export type DraftMeta = {
  title: string;
  metaDescription: string;
  blocks: ContentBlock[];
  featuredImage?: string;
};

const draftKey = (id: string) => `draft:${id}`;

function isBlobURL(url?: string): boolean {
  return !!url && url.startsWith('blob:');
}

async function blobFromObjectURL(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob;
  } catch {
    return null;
  }
}

export async function saveDraft(id: string, meta: DraftMeta): Promise<{ filesStored: number }> {
  let filesStored = 0;
  // Deep clone blocks to avoid mutating live state
  const cloned: ContentBlock[] = JSON.parse(JSON.stringify(meta.blocks || []));
  // Process images inside blocks
  for (const b of cloned) {
    if (b.type === 'image' && Array.isArray((b as any).data?.images)) {
      const imgs = (b as any).data.images as Array<{ src: string; alt?: string }>;
      for (let i = 0; i < imgs.length; i++) {
        const src = imgs[i].src;
        if (isBlobURL(src)) {
          const blob = await blobFromObjectURL(src);
          if (blob) {
            const key = `${id}:img:${i}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
            await putBlob(key, blob);
            imgs[i].src = `draft://${key}`;
            filesStored++;
          }
        }
      }
    }
  }
  // Process featured image if it's a blob url
  const featured = meta.featuredImage;
  let featuredRef = featured;
  if (isBlobURL(featured)) {
    const blob = await blobFromObjectURL(featured!);
    if (blob) {
      const key = `${id}:featured:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      await putBlob(key, blob);
      featuredRef = `draft://${key}`;
      filesStored++;
    }
  }

  const toStore: DraftMeta = {
    title: meta.title,
    metaDescription: meta.metaDescription,
    blocks: cloned,
    featuredImage: featuredRef,
  };
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(toStore));
  } catch {
    // ignore quota errors
  }
  return { filesStored };
}

export async function loadDraft(id: string): Promise<DraftMeta | null> {
  const raw = localStorage.getItem(draftKey(id));
  if (!raw) return null;
  try {
    const meta = JSON.parse(raw) as DraftMeta;
    const cloned: ContentBlock[] = JSON.parse(JSON.stringify(meta.blocks || []));
    // Resolve draft:// refs back to object URLs
    for (const b of cloned) {
      if (b.type === 'image' && Array.isArray((b as any).data?.images)) {
        const imgs = (b as any).data.images as Array<{ src: string; alt?: string }>;
        for (let i = 0; i < imgs.length; i++) {
          const src = imgs[i].src;
          if (src && src.startsWith('draft://')) {
            const key = src.slice('draft://'.length);
            const blob = await getBlob(key);
            if (blob) imgs[i].src = URL.createObjectURL(blob);
          }
        }
      }
    }
    let featuredResolved = meta.featuredImage;
    if (featuredResolved && featuredResolved.startsWith('draft://')) {
      const blob = await getBlob(featuredResolved.slice('draft://'.length));
      if (blob) featuredResolved = URL.createObjectURL(blob);
    }
    return { title: meta.title, metaDescription: meta.metaDescription, blocks: cloned, featuredImage: featuredResolved };
  } catch {
    return null;
  }
}

export function clearDraft(id: string) {
  try { localStorage.removeItem(draftKey(id)); } catch { /* noop */ }
}
