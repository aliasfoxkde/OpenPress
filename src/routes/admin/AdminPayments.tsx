import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  is_enabled: number;
  config: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  order_id: string;
  provider: string;
  provider_transaction_id: string | null;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
}

const PROVIDER_TYPES = [
  { value: "stripe", label: "Stripe", color: "bg-purple-50 text-purple-700" },
  { value: "paypal", label: "PayPal", color: "bg-blue-50 text-blue-700" },
  { value: "square", label: "Square", color: "bg-green-50 text-green-700" },
  { value: "manual", label: "Manual / Offline", color: "bg-yellow-50 text-yellow-700" },
  { value: "custom", label: "Custom", color: "bg-gray-50 text-gray-700" },
];

export function AdminPayments() {
  const toast = useToast();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"providers" | "transactions">("providers");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("stripe");
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [provRes, txRes] = await Promise.all([
        api.get<{ data: PaymentProvider[] }>("/payments/admin/providers").catch(() => null),
        api.get<{ data: Transaction[] }>("/payments/admin/transactions").catch(() => null),
      ]);
      setProviders(provRes?.data || []);
      setTransactions(txRes?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/payments/admin/providers", {
        name: newName.trim(),
        type: newType,
        is_enabled: 0,
        config: "{}",
        settings: "{}",
      });
      toast("Payment provider added", "success");
      setShowCreate(false);
      setNewName("");
      await fetchData();
    } catch {
      toast("Failed to add provider", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/payments/admin/providers/${deleteTarget}`);
      setDeleteTarget(null);
      toast("Provider removed", "success");
      await fetchData();
    } catch {
      toast("Failed to remove provider", "error");
    }
  }

  async function toggleEnabled(id: string, current: number) {
    try {
      await api.put(`/payments/admin/providers/${id}`, { is_enabled: current ? 0 : 1 });
      await fetchData();
    } catch {
      toast("Failed to update provider", "error");
    }
  }

  async function saveConfig() {
    if (!editingId) return;
    setSaving(true);
    try {
      let parsed = {};
      try { parsed = JSON.parse(editConfig); } catch { /* keep empty */ }
      await api.put(`/payments/admin/providers/${editingId}`, { config: JSON.stringify(parsed) });
      toast("Configuration saved", "success");
      setEditingId(null);
      await fetchData();
    } catch {
      toast("Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  }

  function formatAmount(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Payment Providers</h1>
        {activeTab === "providers" && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Add Provider
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {(["providers", "transactions"] as const).map((tab) => (
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
      ) : activeTab === "providers" ? (
        <>
          {showCreate && (
            <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Add Payment Provider</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="My PayPal Account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {PROVIDER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => void handleCreate()} disabled={creating} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {creating ? "Adding..." : "Add Provider"}
                </button>
                <button onClick={() => setShowCreate(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {providers.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">
              No payment providers configured. Add a provider to accept payments beyond Stripe.
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((prov) => (
                <div key={prov.id} className="border border-border rounded-lg bg-surface">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PROVIDER_TYPES.find((t) => t.value === prov.type)?.color || "bg-gray-50 text-gray-600"}`}>
                        {prov.type}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-text-primary">{prov.name}</h3>
                        <div className="text-xs text-text-tertiary">
                          Added {new Date(prov.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setEditingId(prov.id); setEditConfig(prov.config || "{}"); }}
                        className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => void toggleEnabled(prov.id, prov.is_enabled)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                          prov.is_enabled ? "bg-green-50 text-green-700" : "bg-surface-secondary text-text-tertiary"
                        }`}
                      >
                        {prov.is_enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button onClick={() => setDeleteTarget(prov.id)} className="text-xs text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit config modal */}
          {editingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-lg mx-4">
                <h3 className="font-semibold text-text-primary mb-4">Provider Configuration (JSON)</h3>
                <textarea
                  value={editConfig}
                  onChange={(e) => setEditConfig(e.target.value)}
                  rows={12}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none"
                  placeholder='{"api_key": "...", "webhook_secret": "..."}'
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => void saveConfig()} disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Transactions tab */
        transactions.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-secondary">
                    <td className="px-4 py-3 text-sm font-mono">{tx.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-text-primary capitalize">{tx.provider}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatAmount(tx.amount)} {tx.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[tx.status] || "bg-gray-50 text-gray-600"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Payment Provider"
        message="Are you sure you want to remove this payment provider?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
