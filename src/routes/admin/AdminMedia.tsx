import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url?: string;
  created_at: string;
}

export function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchMedia() {
    setLoading(true);
    try {
      const res = await api.get("/api/media");
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMedia();
  }, []);

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
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await api.delete(`/api/media/${id}`);
      await fetchMedia();
    } catch {
      // ignore
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
      <h1 className="text-2xl font-bold text-text-primary mb-6">Media</h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-primary-400 bg-primary-50" : "border-border hover:border-primary-300"
        }`}
      >
        <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" />
        <div className="text-3xl mb-2">{uploading ? "..." : "."}</div>
        <div className="text-sm text-text-secondary font-medium">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </div>
        <div className="text-xs text-text-tertiary mt-1">Max 10MB per file</div>
      </div>

      {loading ? (
        <div className="text-center text-text-tertiary text-sm py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-text-tertiary text-sm py-8">No media files yet.</div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden bg-surface group">
              <div className="aspect-square bg-surface-secondary flex items-center justify-center text-4xl">
                {item.mime_type.startsWith("image/") && item.url ? (
                  <img src={item.url} alt={item.original_name} className="w-full h-full object-cover" />
                ) : (
                  item.mime_type.startsWith("video/") ? "..." : "."
                )}
              </div>
              <div className="p-2">
                <div className="text-xs font-medium text-text-primary truncate">{item.original_name}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{formatSize(item.size_bytes)}</div>
                <button
                  onClick={() => void handleDelete(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
