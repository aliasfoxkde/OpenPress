import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CompositeItem {
  id: string;
  product_id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  product_status: string;
  base_price: number;
  price_display: string;
  layout: string;
  component_count: number;
  option_count: number;
}

interface ProductOption {
  id: string;
  title: string;
  slug: string;
  price: number;
  featured_image_url?: string;
}

interface ComponentOption {
  id: string;
  component_id: string;
  product_id: string;
  sort_order: number;
  base_product_price?: number;
  product_title?: string;
  product_slug?: string;
  product_image?: string;
  product_sku?: string;
  product_inventory?: number;
  price_override?: number;
  price_override_type?: string;
  price_override_value?: number;
  is_default?: number;
}

interface Component {
  id: string;
  title: string;
  description: string | null;
  is_required: number;
  selection_type: string;
  min_quantity: number;
  max_quantity: number;
  display_mode: string;
  sort_order: number;
  options: ComponentOption[];
}

interface Scenario {
  id: string;
  title: string;
  description: string | null;
  is_default: number;
  sort_order: number;
  defaults: { component_id: string; option_id: string | null }[];
}

export function AdminComposite() {
  const toast = useToast();
  const [items, setItems] = useState<CompositeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("0");
  const [newLayout, setNewLayout] = useState("accordion");
  const [newPriceDisplay, setNewPriceDisplay] = useState("range");
  const [creating, setCreating] = useState(false);

  // Edit form (composite metadata)
  const [editComponents, setEditComponents] = useState<Component[]>([]);
  const [editScenarios, setEditScenarios] = useState<Scenario[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editTab, setEditTab] = useState<"components" | "scenarios" | "settings">("components");

  // Add component form
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [compTitle, setCompTitle] = useState("");
  const [compDescription, setCompDescription] = useState("");
  const [compRequired, setCompRequired] = useState(true);
  const [compSelectionType, setCompSelectionType] = useState("single");
  const [compDisplayMode, setCompDisplayMode] = useState("thumbnail");

  // Add option form (per component)
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // Add scenario form
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [scenarioTitle, setScenarioTitle] = useState("");

  async function fetchComposites() {
    setLoading(true);
    try {
      const res = await api.get<{ data: CompositeItem[] }>("/composite/admin");
      setItems(res?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchComposites();
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.post("/composite/admin", {
        title: newTitle.trim(),
        slug: newSlug.trim() || undefined,
        base_price: parseInt(newBasePrice) || 0,
        layout: newLayout,
        price_display: newPriceDisplay,
      });
      toast("Composite product created", "success");
      setShowCreate(false);
      setNewTitle("");
      setNewSlug("");
      setNewBasePrice("0");
      await fetchComposites();
    } catch {
      toast("Failed to create composite product", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/composite/admin/${deleteTarget}`);
      setDeleteTarget(null);
      toast("Composite product deleted", "success");
      await fetchComposites();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  async function openEditor(id: string) {
    setEditingId(id);
    setEditLoading(true);
    setEditTab("components");
    try {
      const res = await api.get<{ data: CompositeItem[] }>("/composite/admin");
      const comp = res?.data?.find((c) => c.id === id);
      if (!comp) return;

      // Load full composite data from public endpoint
      const pubRes = await api.get<{
        data: {
          components: Component[];
          scenarios: Scenario[];
          composite: { base_price: number; price_display: string; layout: string };
        };
      }>(`/composite/${comp.slug}/composite`);

      if (pubRes?.data) {
        setEditComponents(pubRes.data.components || []);
        setEditScenarios(pubRes.data.scenarios || []);
      }
    } catch {
      toast("Failed to load composite details", "error");
    } finally {
      setEditLoading(false);
    }
  }

  async function addComponent() {
    if (!editingId || !compTitle.trim()) return;
    try {
      await api.post(`/composite/admin/${editingId}/components`, {
        title: compTitle.trim(),
        description: compDescription.trim() || null,
        is_required: compRequired,
        selection_type: compSelectionType,
        display_mode: compDisplayMode,
      });
      toast("Component added", "success");
      setShowAddComponent(false);
      setCompTitle("");
      setCompDescription("");
      setCompRequired(true);
      await openEditor(editingId);
    } catch {
      toast("Failed to add component", "error");
    }
  }

  async function removeComponent(componentId: string) {
    if (!editingId) return;
    try {
      await api.delete(`/composite/admin/${editingId}/components/${componentId}`);
      toast("Component removed", "success");
      await openEditor(editingId);
    } catch {
      toast("Failed to remove component", "error");
    }
  }

  async function loadAvailableProducts() {
    try {
      const res = await api.get<{ data: ProductOption[] }>("/products?status=active&limit=100");
      setAvailableProducts(
        (res?.data || []).map((p) => ({
          id: p.id || "",
          title: p.title || "",
          slug: p.slug || "",
          price: p.price || 0,
          featured_image_url: p.featured_image_url,
        })),
      );
    } catch {
      // ignore
    }
  }

  async function openAddOption(componentId: string) {
    setAddingOptionTo(componentId);
    setSelectedProductId("");
    await loadAvailableProducts();
  }

  async function addOption(componentId: string) {
    if (!editingId || !selectedProductId) return;
    try {
      await api.post(`/composite/admin/${editingId}/components/${componentId}/options`, {
        product_id: selectedProductId,
      });
      toast("Option added", "success");
      setAddingOptionTo(null);
      setSelectedProductId("");
      await openEditor(editingId);
    } catch {
      toast("Failed to add option", "error");
    }
  }

  async function removeOption(componentId: string, optionId: string) {
    if (!editingId) return;
    try {
      await api.delete(`/composite/admin/${editingId}/components/${componentId}/options/${optionId}`);
      toast("Option removed", "success");
      await openEditor(editingId);
    } catch {
      toast("Failed to remove option", "error");
    }
  }

  async function addScenario() {
    if (!editingId || !scenarioTitle.trim()) return;
    try {
      await api.post(`/composite/admin/${editingId}/scenarios`, {
        title: scenarioTitle.trim(),
        defaults: editComponents.map((c) => ({
          component_id: c.id,
          option_id: c.options?.[0]?.id || null,
        })),
      });
      toast("Scenario added", "success");
      setShowAddScenario(false);
      setScenarioTitle("");
      await openEditor(editingId);
    } catch {
      toast("Failed to add scenario", "error");
    }
  }

  async function removeScenario(scenarioId: string) {
    if (!editingId) return;
    try {
      await api.delete(`/composite/admin/${editingId}/scenarios/${scenarioId}`);
      toast("Scenario removed", "success");
      await openEditor(editingId);
    } catch {
      toast("Failed to remove scenario", "error");
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Editor view
  if (editingId) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Edit Composite</h1>
          <button
            onClick={() => setEditingId(null)}
            className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            Back to List
          </button>
        </div>

        {editLoading ? (
          <div className="text-center py-8 text-text-tertiary">Loading...</div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-border mb-6">
              <nav className="-mb-px flex space-x-8">
                {(["components", "scenarios", "settings"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEditTab(tab)}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                      editTab === tab ? "border-primary-500 text-primary-600" : "border-transparent text-text-tertiary hover:border-border hover:text-text-secondary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Components Tab */}
            {editTab === "components" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-text-primary">Components ({editComponents.length})</h2>
                  <button
                    onClick={() => setShowAddComponent(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Add Component
                  </button>
                </div>

                {editComponents.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary border border-dashed border-border rounded-lg">
                    No components yet. Add a component to define what customers can configure.
                  </div>
                ) : (
                  editComponents.map((comp) => (
                    <div key={comp.id} className="border border-border rounded-lg bg-surface">
                      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-text-primary">{comp.title}</h3>
                          {comp.description && <p className="text-xs text-text-tertiary mt-0.5">{comp.description}</p>}
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                              {comp.selection_type}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                              {comp.display_mode}
                            </span>
                            {comp.is_required ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">required</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">optional</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void openAddOption(comp.id)}
                            className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            Add Option
                          </button>
                          <button
                            onClick={() => void removeComponent(comp.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {comp.options && comp.options.length > 0 ? (
                        <div className="divide-y divide-border">
                          {comp.options.map((opt) => (
                            <div key={opt.id} className="px-6 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {opt.product_image ? (
                                  <img src={opt.product_image} alt="" className="w-10 h-10 rounded object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-surface-secondary" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-text-primary">{opt.product_title}</div>
                                  <div className="text-xs text-text-tertiary">
                                    {opt.product_sku && <span>{opt.product_sku} &middot; </span>}
                                    {formatPrice(opt.base_product_price || opt.price_override || 0)}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => void removeOption(comp.id, opt.id)}
                                className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-6 py-4 text-center text-sm text-text-tertiary">
                          No options. Add products for customers to choose from.
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Add Component Modal */}
                {showAddComponent && (
                  <div className="border border-primary-300 rounded-lg bg-surface p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Add Component</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                        <input
                          value={compTitle}
                          onChange={(e) => setCompTitle(e.target.value)}
                          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                          placeholder="e.g., Choose your CPU"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <input
                          value={compDescription}
                          onChange={(e) => setCompDescription(e.target.value)}
                          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                          placeholder="Optional description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Selection Type</label>
                        <select
                          value={compSelectionType}
                          onChange={(e) => setCompSelectionType(e.target.value)}
                          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        >
                          <option value="single">Single</option>
                          <option value="multi">Multi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Display Mode</label>
                        <select
                          value={compDisplayMode}
                          onChange={(e) => setCompDisplayMode(e.target.value)}
                          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        >
                          <option value="thumbnail">Thumbnail</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="swatch">Swatch</option>
                          <option value="radio">Radio</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={compRequired}
                          onChange={(e) => setCompRequired(e.target.checked)}
                          className="rounded border-border"
                        />
                        Required
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => void addComponent()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddComponent(false)}
                        className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Option Modal */}
                {addingOptionTo && (
                  <div className="border border-primary-300 rounded-lg bg-surface p-6 mt-4">
                    <h3 className="font-semibold text-text-primary mb-4">Add Product Option</h3>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Select a product...</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} — {formatPrice(p.price)}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => void addOption(addingOptionTo)}
                        disabled={!selectedProductId}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingOptionTo(null)}
                        className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scenarios Tab */}
            {editTab === "scenarios" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-text-primary">Scenarios ({editScenarios.length})</h2>
                  <button
                    onClick={() => setShowAddScenario(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Add Scenario
                  </button>
                </div>

                {editScenarios.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary border border-dashed border-border rounded-lg">
                    No scenarios. Create pre-defined configurations for customers.
                  </div>
                ) : (
                  editScenarios.map((scenario) => (
                    <div key={scenario.id} className="border border-border rounded-lg bg-surface">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-text-primary">{scenario.title}</h3>
                          {scenario.description && <p className="text-xs text-text-tertiary mt-0.5">{scenario.description}</p>}
                          {scenario.is_default && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 mt-1 inline-block">
                              Default
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => void removeScenario(scenario.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {showAddScenario && (
                  <div className="border border-primary-300 rounded-lg bg-surface p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Add Scenario</h3>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                      <input
                        value={scenarioTitle}
                        onChange={(e) => setScenarioTitle(e.target.value)}
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        placeholder="e.g., Gaming Build, Office Setup"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => void addScenario()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddScenario(false)}
                        className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {editTab === "settings" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-text-primary">Composite Settings</h2>
                <p className="text-sm text-text-tertiary">Settings for this composite product can be configured via the API or a dedicated settings form in a future update.</p>
                <div className="text-xs text-text-tertiary border border-border rounded-lg p-4 bg-surface-secondary">
                  <p className="font-medium text-text-secondary mb-1">Composite ID</p>
                  <code className="text-xs break-all">{editingId}</code>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Composite Products</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          New Composite
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-4">Create Composite Product</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Custom PC Builder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="custom-pc-builder (auto-generated if empty)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base Price (cents)</label>
              <input
                type="number"
                value={newBasePrice}
                onChange={(e) => setNewBasePrice(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Layout</label>
              <select
                value={newLayout}
                onChange={(e) => setNewLayout(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="accordion">Accordion</option>
                <option value="wizard">Wizard</option>
                <option value="tabs">Tabs</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Price Display</label>
              <select
                value={newPriceDisplay}
                onChange={(e) => setNewPriceDisplay(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="range">Range ($500 - $2000)</option>
                <option value="from">From ($500+)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Composite"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          No composite products yet. Create one to let customers build custom products.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg bg-surface hover:border-primary-300 transition-colors">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {item.slug} &middot; {formatPrice(item.base_price)} base &middot; {item.layout} layout
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                      {item.component_count} components
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                      {item.option_count} options
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.product_status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                    }`}>
                      {item.product_status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void openEditor(item.id)}
                    className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Composite Product"
        message="Are you sure? This will delete the composite product, all its components, options, and scenarios."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
