export function AdminSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>
      <div className="space-y-6 max-w-2xl">
        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-sm font-medium text-text-primary px-2">
            General
          </legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Site Title
              </label>
              <input
                type="text"
                defaultValue="My OpenPress Site"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Site Description
              </label>
              <textarea
                rows={2}
                defaultValue="A modern CMS powered by OpenPress"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
          </div>
        </fieldset>
        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-sm font-medium text-text-primary px-2">
            Permalinks
          </legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="permalink" defaultChecked />
              <span>/post/:slug</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="permalink" />
              <span>/:year/:month/:slug</span>
            </label>
          </div>
        </fieldset>
        <button className="bg-primary-600 text-white px-6 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
