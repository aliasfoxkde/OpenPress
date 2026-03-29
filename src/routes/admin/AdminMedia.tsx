export function AdminMedia() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Media</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
          Upload
        </button>
      </div>
      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-surface-secondary">
        <div className="text-4xl mb-3">📁</div>
        <p className="text-text-secondary text-sm">
          Drop files here or click to upload
        </p>
        <p className="text-text-tertiary text-xs mt-1">
          Images, documents, and other files up to 10MB
        </p>
      </div>
    </div>
  );
}
