import { useState, useEffect, useRef, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  background_image_url: string | null;
  background_gradient: string;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  is_active: number;
  animation_type: string;
  sort_order: number;
  created_at: string;
}

const GRADIENT_PRESETS = [
  { label: "Indigo", value: "from-indigo-950 via-indigo-900 to-indigo-800" },
  { label: "Purple", value: "from-purple-950 via-purple-900 to-violet-800" },
  { label: "Slate", value: "from-slate-950 via-gray-900 to-zinc-800" },
  { label: "Emerald", value: "from-emerald-950 via-emerald-900 to-teal-800" },
  { label: "Rose", value: "from-rose-950 via-rose-900 to-pink-800" },
  { label: "Sky", value: "from-sky-950 via-sky-900 to-cyan-800" },
  { label: "Amber", value: "from-amber-950 via-amber-900 to-orange-800" },
];

const ANIMATION_TYPES = [
  { label: "Slide", value: "slide" },
  { label: "Fade", value: "fade" },
  { label: "Bounce", value: "bounce" },
  { label: "Zoom", value: "zoom" },
];

const emptySlide: Omit<HeroSlide, "id"> = {
  title: "",
  subtitle: "",
  content: "",
  background_image_url: null,
  background_gradient: "from-primary-950 via-primary-900 to-primary-800",
  primary_button_text: "",
  primary_button_url: "",
  secondary_button_text: "",
  secondary_button_url: "",
  is_active: 1,
  animation_type: "slide",
  sort_order: 0,
};

export function AdminHeroSlides() {
  const toast = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySlide);
  const [saving, setSaving] = useState(false);

  const loadSlides = useCallback(async () => {
    try {
      const res = await api.get<{ data: HeroSlide[] }>("/admin/hero-slides");
      setSlides(res.data || []);
    } catch {
      toast("Failed to load slides", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const handleNew = () => {
    setEditingId(null);
    setForm(emptySlide);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      content: slide.content || "",
      background_image_url: slide.background_image_url || null,
      background_gradient: slide.background_gradient,
      primary_button_text: slide.primary_button_text || "",
      primary_button_url: slide.primary_button_url || "",
      secondary_button_text: slide.secondary_button_text || "",
      secondary_button_url: slide.secondary_button_url || "",
      is_active: slide.is_active,
      animation_type: slide.animation_type,
      sort_order: slide.sort_order,
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/hero-slides/${editingId}`, form);
        toast("Slide updated", "success");
      } else {
        await api.post("/admin/hero-slides", form);
        toast("Slide created", "success");
      }
      setEditingId(null);
      setForm(emptySlide);
      void loadSlides();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save slide", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/hero-slides/${id}`);
      toast("Slide deleted", "success");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptySlide);
      }
      void loadSlides();
    } catch {
      toast("Failed to delete slide", "error");
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await api.put(`/admin/hero-slides/${slide.id}`, { is_active: !slide.is_active });
      void loadSlides();
    } catch {
      toast("Failed to toggle slide", "error");
    }
  };

  const updateField = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const reordered = [...slides];
    const [a, b] = [reordered[index], reordered[newIndex]];
    reordered[index] = b;
    reordered[newIndex] = a;
    // Update sort orders
    const items = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
    try {
      await api.put("/admin/hero-slides/reorder", { items });
      void loadSlides();
    } catch {
      toast("Failed to reorder slides", "error");
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hero Slides</h1>
          <p className="text-sm text-text-secondary mt-1">Manage the homepage hero slideshow. Drag to reorder, edit content, and toggle visibility.</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + New Slide
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                editingId === slide.id ? "border-primary-300 bg-primary-50/30" : "border-border bg-surface",
                !slide.is_active && "opacity-60",
              )}
            >
              {/* Preview bar */}
              <div
                className="h-20 flex items-center justify-center text-white relative overflow-hidden"
                style={{
                  backgroundImage: slide.background_image_url ? `url(${slide.background_image_url})` : undefined,
                  background: slide.background_image_url ? "center/cover" : `linear-gradient(135deg, ${slide.background_gradient})`,
                }}
              >
                {slide.background_image_url && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative z-10 text-center">
                  <div className="text-lg font-bold">{slide.title}</div>
                  {slide.subtitle && <div className="text-sm opacity-80">{slide.subtitle}</div>}
                </div>
              </div>

              {/* Slide info */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{slide.title}</div>
                    <div className="text-xs text-text-tertiary">{slide.animation_type} &middot; {slide.is_active ? "Active" : "Hidden"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className={cn(
                      "p-1 transition-colors",
                      slide.is_active ? "text-green-600" : "text-text-tertiary hover:text-text-primary",
                    )}
                    title={slide.is_active ? "Hide slide" : "Show slide"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {slide.is_active ? <path d="M1 12s4-8 11-8 11 8 11 8-8 4-8-4-8" /> : <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(slide)}
                    className="p-1 text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1 4 9.5a2.121 2.121 0 0 1-3-3L9 9" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="p-1 text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {slides.length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-sm">
              No slides yet. Click "+ New Slide" to create one.
            </div>
          )}
        </div>
      )}

      {/* Edit/Create form */}
      {(editingId !== null || true) && (
        <div className={cn(
          "mt-6 border rounded-lg bg-surface overflow-hidden",
          editingId ? "border-primary-300" : "border-border",
        )}>
          <div className="px-5 py-3 border-b border-border bg-surface-secondary flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {editingId ? "Edit Slide" : "Create New Slide"}
            </h3>
            {!editingId && (
              <button
                onClick={() => setEditingId(null)}
                className="text-xs text-text-tertiary hover:text-text-primary"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. The CMS,"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="e.g. Reimagined."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Content / Description</label>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Brief description shown on the slide..."
                rows={2}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Background Gradient</label>
              <select
                value={form.background_gradient}
                onChange={(e) => updateField("background_gradient", e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              >
                {GRADIENT_PRESETS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label} — {g.value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Background Image URL</label>
              <input
                type="url"
                value={form.background_image_url || ""}
                onChange={(e) => updateField("background_image_url", e.target.value || null)}
                placeholder="https://example.com/image.jpg (optional, overrides gradient)"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Animation Type</label>
                <select
                  value={form.animation_type}
                  onChange={(e) => updateField("animation_type", e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                  {ANIMATION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Visibility</label>
                <button
                  onClick={() => updateField("is_active", form.is_active ? 0 : 1)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    form.is_active ? "border-green-200 bg-green-50 text-green-700" : "border-border bg-surface text-text-secondary",
                  )}
                >
                  {form.is_active ? "Active" : "Hidden"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Primary Button Text</label>
                <input
                  type="text"
                  value={form.primary_button_text}
                  onChange={(e) => updateField("primary_button_text", e.target.value)}
                  placeholder="Open Dashboard"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Primary Button URL</label>
                <input
                  type="text"
                  value={form.primary_button_url}
                  onChange={(e) => updateField("primary_button_url", e.target.value)}
                  placeholder="/admin"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Button Text</label>
                <input
                  type="text"
                  value={form.secondary_button_text}
                  onChange={(e) => updateField("secondary_button_text", e.target.value)}
                  placeholder="View on GitHub"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Button URL</label>
                <input
                  type="text"
                  value={form.secondary_button_url}
                  onChange={(e) => updateField("secondary_button_url", e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Slide" : "Create Slide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
