import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MenuLocation {
  id: string;
  name: string;
  description: string | null;
  max_depth: number;
}

interface MenuItem {
  id: string;
  menu_id: string;
  parent_id: string | null;
  title: string;
  url: string | null;
  type: string;
  reference_id: string | null;
  target: string;
  icon: string | null;
  is_visible: number;
  sort_order: number;
  depth: number;
  children?: MenuItem[];
}

export function AdminNavigation() {
  const toast = useToast();
  const [locations, setLocations] = useState<MenuLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Location form
  const [locName, setLocName] = useState("");
  const [locDesc, setLocDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Item form
  const [itemTitle, setItemTitle] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [itemType, setItemType] = useState("link");
  const [itemTarget, setItemTarget] = useState("self");
  const [itemIcon, setItemIcon] = useState("");
  const [itemParentId, setItemParentId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function fetchLocations() {
    setLoading(true);
    try {
      const res = await api.get<{ data: MenuLocation[] }>("/navigation/admin/navigation").catch(() => null);
      setLocations(res?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLocations();
  }, []);

  async function fetchMenuItems(locationId: string) {
    try {
      const res = await api.get<{ data: MenuItem[] }>(`/navigation/admin/navigation/${locationId}`).catch(() => null);
      setMenuItems(res?.data || []);
    } catch {
      setMenuItems([]);
    }
  }

  useEffect(() => {
    if (selectedLocation) {
      void fetchMenuItems(selectedLocation);
    } else {
      setMenuItems([]);
    }
  }, [selectedLocation]);

  async function createLocation() {
    if (!locName.trim()) return;
    setCreating(true);
    try {
      await api.post("/navigation/admin/navigation/locations", {
        name: locName.trim(),
        description: locDesc.trim() || null,
      });
      toast("Menu location created", "success");
      setShowAddLocation(false);
      setLocName("");
      setLocDesc("");
      await fetchLocations();
    } catch {
      toast("Failed to create location", "error");
    } finally {
      setCreating(false);
    }
  }

  async function addMenuItem() {
    if (!selectedLocation || !itemTitle.trim()) return;
    setAdding(true);
    try {
      await api.post(`/navigation/admin/navigation/${selectedLocation}/items`, {
        title: itemTitle.trim(),
        url: itemUrl.trim() || null,
        type: itemType,
        target: itemTarget,
        icon: itemIcon.trim() || null,
        parent_id: itemParentId,
      });
      toast("Menu item added", "success");
      setShowAddItem(false);
      setItemTitle("");
      setItemUrl("");
      setItemIcon("");
      setItemParentId(null);
      await fetchMenuItems(selectedLocation);
    } catch {
      toast("Failed to add item", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedLocation) return;
    try {
      if (deleteTarget.type === "location") {
        await api.delete(`/navigation/admin/navigation/locations/${deleteTarget.id}`);
        setSelectedLocation(null);
        setMenuItems([]);
      } else {
        await api.delete(`/navigation/admin/navigation/${selectedLocation}/items/${deleteTarget.id}`);
        await fetchMenuItems(selectedLocation);
      }
      setDeleteTarget(null);
      toast("Deleted", "success");
      await fetchLocations();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  function renderTree(items: MenuItem[], depth: number = 0): React.ReactNode[] {
    return items
      .filter((item) => item.depth === depth)
      .map((item) => {
        const children = items.filter((c) => c.parent_id === item.id);
        return (
          <div key={item.id}>
            <div
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-secondary rounded-md group"
              style={{ paddingLeft: `${16 + depth * 24}px` }}
            >
              {depth > 0 && <span className="text-text-tertiary">└</span>}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{item.title}</div>
                <div className="text-xs text-text-tertiary">
                  {item.type} {item.url && `· ${item.url}`} {item.target === "_blank" && "· opens in new tab"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_visible ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                  {item.is_visible ? "Visible" : "Hidden"}
                </span>
                <button onClick={() => setDeleteTarget({ type: "item", id: item.id })} className="text-xs text-red-500 hover:text-red-700">
                  Remove
                </button>
              </div>
            </div>
            {children.length > 0 && renderTree(items, depth + 1)}
          </div>
        );
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Navigation</h1>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar: Menu Locations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-text-primary text-sm">Menus</h2>
              <button
                onClick={() => setShowAddLocation(true)}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                + Add
              </button>
            </div>

            {showAddLocation && (
              <div className="border border-primary-300 rounded-lg bg-surface p-4 mb-3">
                <input value={locName} onChange={(e) => setLocName(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm mb-2 focus:border-primary-500 focus:outline-none" placeholder="Menu name" />
                <input value={locDesc} onChange={(e) => setLocDesc(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm mb-2 focus:border-primary-500 focus:outline-none" placeholder="Description (optional)" />
                <div className="flex gap-2">
                  <button onClick={() => void createLocation()} disabled={creating} className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                    {creating ? "..." : "Add"}
                  </button>
                  <button onClick={() => setShowAddLocation(false)} className="text-xs text-text-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedLocation === loc.id ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {locations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => selectedLocation && setDeleteTarget({ type: "location", id: selectedLocation })}
                  disabled={!selectedLocation}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
                >
                  Delete selected menu
                </button>
              </div>
            )}
          </div>

          {/* Main: Menu Items */}
          <div>
            {selectedLocation ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-text-primary">
                    {locations.find((l) => l.id === selectedLocation)?.name} Items
                  </h2>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Add Item
                  </button>
                </div>

                {showAddItem && (
                  <div className="border border-primary-300 rounded-lg bg-surface p-4 mb-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Title *</label>
                        <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
                        <input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" placeholder="/about or https://..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
                        <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none">
                          <option value="link">Link</option>
                          <option value="page">Page</option>
                          <option value="post">Post</option>
                          <option value="category">Category</option>
                          <option value="separator">Separator</option>
                          <option value="heading">Heading</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Target</label>
                        <select value={itemTarget} onChange={(e) => setItemTarget(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none">
                          <option value="self">Same window</option>
                          <option value="_blank">New window</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Icon</label>
                        <input value={itemIcon} onChange={(e) => setItemIcon(e.target.value)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" placeholder="emoji or class" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Parent</label>
                        <select value={itemParentId || ""} onChange={(e) => setItemParentId(e.target.value || null)} className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none">
                          <option value="">Top level</option>
                          {menuItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {"  ".repeat(item.depth)}{item.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => void addMenuItem()} disabled={adding} className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                        {adding ? "..." : "Add"}
                      </button>
                      <button onClick={() => setShowAddItem(false)} className="text-xs text-text-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {menuItems.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary border border-dashed border-border rounded-lg">
                    No items yet. Add links, pages, or separators to this menu.
                  </div>
                ) : (
                  <div className="border border-border rounded-lg bg-surface p-2">
                    {renderTree(menuItems)}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-text-tertiary">
                Select a menu from the sidebar to manage its items.
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete"
        message="Are you sure you want to delete this?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
