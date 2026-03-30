import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_enabled: number;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  type: string;
  description: string | null;
  banner_image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: number;
  created_at: string;
}

export function AdminMarketing() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"coupons" | "campaigns">("coupons");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Coupon form
  const [cCode, setCCode] = useState("");
  const [cType, setCType] = useState("percentage");
  const [cValue, setCValue] = useState("");
  const [cMinOrder, setCMinOrder] = useState("0");
  const [cMaxUses, setCMaxUses] = useState("");
  const [cExpiresAt, setCExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Campaign form
  const [campTitle, setCampTitle] = useState("");
  const [campType, setCampType] = useState("sale");
  const [campDesc, setCampDesc] = useState("");
  const [campBanner, setCampBanner] = useState("");
  const [campEnds, setCampEnds] = useState("");
  const [creatingCamp, setCreatingCamp] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [coupRes, campRes] = await Promise.all([
        api.get<{ data: Coupon[] }>("/marketing/admin/marketing/coupons").catch(() => null),
        api.get<{ data: Campaign[] }>("/marketing/admin/marketing/campaigns").catch(() => null),
      ]);
      setCoupons(coupRes?.data || []);
      setCampaigns(campRes?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  async function createCoupon() {
    if (!cCode.trim() || !cValue) return;
    setCreating(true);
    try {
      await api.post("/marketing/admin/marketing/coupons", {
        code: cCode.trim().toUpperCase(),
        type: cType,
        value: parseInt(cValue) || 0,
        min_order: parseInt(cMinOrder) || 0,
        max_uses: cMaxUses ? parseInt(cMaxUses) : null,
        expires_at: cExpiresAt || null,
      });
      toast("Coupon created", "success");
      setShowCreate(false);
      setCCode("");
      setCValue("");
      setCMinOrder("0");
      setCMaxUses("");
      setCExpiresAt("");
      await fetchData();
    } catch {
      toast("Failed to create coupon", "error");
    } finally {
      setCreating(false);
    }
  }

  async function createCampaign() {
    if (!campTitle.trim()) return;
    setCreatingCamp(true);
    try {
      await api.post("/marketing/admin/marketing/campaigns", {
        title: campTitle.trim(),
        type: campType,
        description: campDesc.trim() || null,
        banner_image_url: campBanner.trim() || null,
        ends_at: campEnds || null,
      });
      toast("Campaign created", "success");
      setShowCreate(false);
      setCampTitle("");
      setCampDesc("");
      setCampBanner("");
      setCampEnds("");
      await fetchData();
    } catch {
      toast("Failed to create campaign", "error");
    } finally {
      setCreatingCamp(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "coupon") {
        await api.delete(`/marketing/admin/marketing/coupons/${deleteTarget.id}`);
      } else {
        await api.delete(`/marketing/admin/marketing/campaigns/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      toast("Deleted", "success");
      await fetchData();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  function formatCouponValue(coupon: Coupon) {
    if (coupon.type === "percentage") return `${coupon.value}%`;
    if (coupon.type === "free_shipping") return "Free Shipping";
    return `$${(coupon.value / 100).toFixed(2)}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Marketing</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          New {activeTab === "coupons" ? "Coupon" : "Campaign"}
        </button>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {(["coupons", "campaigns"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                activeTab === tab ? "border-primary-500 text-primary-600" : "border-transparent text-text-tertiary hover:border-border hover:text-text-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      ) : activeTab === "coupons" ? (
        <>
          {showCreate && (
            <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Create Coupon</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Code *</label>
                  <input value={cCode} onChange={(e) => setCCode(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm uppercase focus:border-primary-500 focus:outline-none" placeholder="SAVE20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                  <select value={cType} onChange={(e) => setCType(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Value</label>
                  <input type="number" value={cValue} onChange={(e) => setCValue(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder={cType === "percentage" ? "20" : "1000"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Min Order (cents)</label>
                  <input type="number" value={cMinOrder} onChange={(e) => setCMinOrder(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Max Uses</label>
                  <input type="number" value={cMaxUses} onChange={(e) => setCMaxUses(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Expires</label>
                  <input type="datetime-local" value={cExpiresAt} onChange={(e) => setCExpiresAt(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => void createCoupon()} disabled={creating} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {coupons.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">No coupons yet. Create one to offer discounts.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Usage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Expires</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-secondary">
                      <td className="px-4 py-3 text-sm font-mono font-medium">{c.code}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary capitalize">{c.type}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCouponValue(c)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                          {c.is_enabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-tertiary">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteTarget({ type: "coupon", id: c.id })} className="text-xs text-red-500 hover:text-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {showCreate && (
            <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Create Campaign</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                  <input value={campTitle} onChange={(e) => setCampTitle(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="Summer Sale" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                  <select value={campType} onChange={(e) => setCampType(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                    <option value="sale">Sale</option>
                    <option value="flash">Flash Sale</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="clearance">Clearance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <input value={campDesc} onChange={(e) => setCampDesc(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Banner Image URL</label>
                  <input value={campBanner} onChange={(e) => setCampBanner(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                  <input type="datetime-local" value={campEnds} onChange={(e) => setCampEnds(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => void createCampaign()} disabled={creatingCamp} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {creatingCamp ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">No campaigns yet. Create promotional campaigns.</div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div key={camp.id} className="border border-border rounded-lg bg-surface px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">{camp.title}</h3>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      <span className="capitalize">{camp.type}</span>
                      {camp.ends_at && ` · Ends ${new Date(camp.ends_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${camp.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                      {camp.is_active ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => setDeleteTarget({ type: "campaign", id: camp.id })} className="text-xs text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message="Are you sure you want to delete this?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
