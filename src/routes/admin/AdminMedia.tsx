import { useEffect, useState, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url?: string;
  created_at: string;
}

function FaviconSection() {
  const toast = useToast();
  const [faviconUrl, setFaviconUrl] = useState(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    return link?.href || "";
  });
  const [appleTouchIcon, setAppleTouchIcon] = useState(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    return link?.href || "";
  });
  const faviconRef = useRef<HTMLInputElement>(null);
  const appleRef = useRef<HTMLInputElement>(null);

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/media", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data?.data?.url || "";
        setFaviconUrl(url);
        // Update favicon in document head
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = url;
        toast("Favicon updated", "success");
      } else {
        toast("Failed to upload favicon", "error");
      }
    } catch {
      toast("Failed to upload favicon", "error");
    }
    if (faviconRef.current) faviconRef.current.value = "";
  }

  async function handleAppleTouchUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/media", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data?.data?.url || "";
        setAppleTouchIcon(url);
        let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "apple-touch-icon";
          document.head.appendChild(link);
        }
        link.href = url;
        toast("Apple Touch Icon updated", "success");
      } else {
        toast("Failed to upload icon", "error");
      }
    } catch {
      toast("Failed to upload icon", "error");
    }
    if (appleRef.current) appleRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg border border-border bg-surface-secondary flex items-center justify-center overflow-hidden shrink-0">
          {faviconUrl ? (
            <img src={faviconUrl} alt="Favicon" className="w-8 h-8" />
          ) : (
            <span className="text-lg text-text-tertiary">...</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">Favicon</div>
          <div className="text-xs text-text-tertiary">32x32 or 64x64 PNG, ICO, or SVG</div>
        </div>
        <input ref={faviconRef} type="file" accept=".png,.ico,.svg,.jpg,.jpeg" onChange={handleFaviconUpload} className="hidden" />
        <button onClick={() => faviconRef.current?.click()} className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors">
          Upload
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg border border-border bg-surface-secondary flex items-center justify-center overflow-hidden shrink-0">
          {appleTouchIcon ? (
            <img src={appleTouchIcon} alt="Apple Touch Icon" className="w-10 h-10 rounded" />
          ) : (
            <span className="text-lg text-text-tertiary">...</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">Apple Touch Icon</div>
          <div className="text-xs text-text-tertiary">180x180 PNG for iOS home screen</div>
        </div>
        <input ref={appleRef} type="file" accept=".png" onChange={handleAppleTouchUpload} className="hidden" />
        <button onClick={() => appleRef.current?.click()} className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors">
          Upload
        </button>
      </div>

      <div className="text-xs text-text-tertiary border-t border-border pt-3">
        <p className="font-medium text-text-secondary mb-1">Keyboard Shortcuts</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span><kbd className="bg-surface-secondary px-1.5 py-0.5 rounded text-[10px]">Ctrl+K</kbd> Search</span>
          <span><kbd className="bg-surface-secondary px-1.5 py-0.5 rounded text-[10px]">Ctrl+S</kbd> Save (editor)</span>
          <span><kbd className="bg-surface-secondary px-1.5 py-0.5 rounded text-[10px]">Ctrl+B</kbd> Bold</span>
          <span><kbd className="bg-surface-secondary px-1.5 py-0.5 rounded text-[10px]">Ctrl+I</kbd> Italic</span>
        </div>
      </div>
    </div>
  );
}

export function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  async function fetchMedia() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api.get<{ data: MediaItem[] }>(`/media${query}`);
      setItems(res?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void fetchMedia(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/media", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) await fetchMedia();
      else toast("Failed to upload file", "error");
    } catch {
      toast("Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/media/${deleteTarget}`);
      setDeleteTarget(null);
      await fetchMedia();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete file", "error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      void uploadFile(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    for (const file of Array.from(e.target.files || [])) {
      void uploadFile(file);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Media</h1>
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 rounded-md border border-border px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      {/* Favicon & Site Icons */}
      <div className="border border-border rounded-lg bg-surface mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Favicon &amp; Site Icons</h2>
          <p className="text-xs text-text-tertiary mt-1">Upload icons for browser tabs, bookmarks, and home screen shortcuts</p>
        </div>
        <div className="px-6 py-4">
          <FaviconSection />
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-primary-400 bg-primary-50" : "border-border hover:border-primary-300"
        }`}
      >
        <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" aria-label="Upload files" />
        <div className="text-3xl mb-2">{uploading ? "..." : "."}</div>
        <div className="text-sm text-text-secondary font-medium">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </div>
        <div className="text-xs text-text-tertiary mt-1">Max 10MB per file</div>
      </div>

      {loading ? (
        <div className="text-center text-text-tertiary text-sm py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-text-tertiary text-sm py-8">
          {search ? "No files match your search." : "No media files yet."}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden bg-surface group">
              <div className="aspect-square bg-surface-secondary flex items-center justify-center text-4xl">
                {item.mime_type.startsWith("image/") && item.url ? (
                  <img src={item.url} alt={item.original_name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  item.mime_type.startsWith("video/") ? "..." : "."
                )}
              </div>
              <div className="p-2">
                <div className="text-xs font-medium text-text-primary truncate">{item.original_name}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{formatSize(item.size_bytes)}</div>
                <button
                  onClick={() => setDeleteTarget(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete File"
        message="Are you sure you want to delete this file permanently?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
