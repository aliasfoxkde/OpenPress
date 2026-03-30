import { useContext } from "react";
import { SidebarContext } from "./Sidebar";

interface DocumentPanelProps {
  contentType: string;
  onContentTypeChange: (type: string) => void;
  isCreateMode: boolean;
  status: string;
  onStatusChange: (status: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (val: string) => void;
  markChanged: () => void;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

export function DocumentPanel({
  contentType,
  onContentTypeChange,
  isCreateMode,
  status,
  onStatusChange,
  scheduledAt,
  onScheduledAtChange,
  markChanged,
}: DocumentPanelProps) {
  const { activePanel } = useContext(SidebarContext);

  if (activePanel !== "document") return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Document</h3>

      {/* Content Type (create mode only) */}
      {isCreateMode && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
          <div className="inline-flex rounded-md border border-border">
            {(["post", "page"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onContentTypeChange(t)}
                className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  contentType === t
                    ? "bg-primary-600 text-white"
                    : "bg-surface text-text-secondary hover:bg-surface-secondary"
                } ${t === "post" ? "rounded-l-md" : "rounded-r-md"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => { onStatusChange(e.target.value); markChanged(); }}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm bg-surface focus:border-border-focus focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Schedule datetime */}
      {status === "scheduled" && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Schedule</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => { onScheduledAtChange(e.target.value); markChanged(); }}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm bg-surface focus:border-border-focus focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
