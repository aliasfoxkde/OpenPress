interface EditorBottomBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  lastSaved?: string;
  wordCount: number;
  readingTime: string;
}

export function EditorBottomBar({ hasChanges, isSaving, lastSaved, wordCount, readingTime }: EditorBottomBarProps) {
  return (
    <div className="shrink-0 border-t border-border bg-surface-secondary px-4 py-1.5 flex items-center justify-between text-xs text-text-tertiary">
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span>{readingTime} read</span>
      </div>
      <div className="flex items-center gap-2">
        {hasChanges && (
          <span className="text-yellow-600">Unsaved changes</span>
        )}
        {isSaving && (
          <span className="text-primary-600">Saving...</span>
        )}
        {!hasChanges && !isSaving && lastSaved && (
          <span>Saved {lastSaved}</span>
        )}
      </div>
    </div>
  );
}
