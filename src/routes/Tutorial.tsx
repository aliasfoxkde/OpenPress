import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  code?: string;
  note?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Fork the OpenPress Repository",
    description: "Start by forking the OpenPress repo on GitHub to your own account.",
    details: [
      "Go to https://github.com/aliasfoxkde/OpenPress",
      'Click the "Fork" button in the top-right corner',
      "Select your GitHub account as the destination",
      'Click "Create fork" to create your copy',
    ],
    note: "Forking gives you your own copy of the codebase that you can freely modify. You can also use GitHub Codespaces to work entirely in the browser.",
  },
  {
    id: 2,
    title: "Create a Cloudflare Account",
    description: "Sign up for a free Cloudflare account if you don't already have one.",
    details: [
      "Go to https://dash.cloudflare.com/sign-up",
      "Enter your email address and create a password",
      "Verify your email address",
      "Complete the onboarding wizard",
    ],
    note: "The free tier includes Workers (100,000 requests/day), D1 (5GB storage), R2 (10GB storage + 10M reads/month), and KV (100,000 reads/day) — more than enough for most sites.",
  },
  {
    id: 3,
    title: "Navigate to Workers & Pages",
    description: "In the Cloudflare dashboard, find the Workers & Pages section.",
    details: [
      "Log in to your Cloudflare dashboard at https://dash.cloudflare.com",
      'In the left sidebar, click on "Compute" and select "Workers & Pages"',
    ],
  },
  {
    id: 4,
    title: "Create a Pages Application",
    description: "Import your GitHub repository as a new Cloudflare Pages project.",
    details: [
      'Click the blue "Create" button',
      'Scroll to the bottom and find "Looking to deploy Pages?"',
      'Click "Get started"',
      'Select "Import an existing Git repository" and click "Get started"',
      "Select your GitHub account (if you have multiple, pick the right one)",
      'Find and select the "OpenPress" repository you forked',
    ],
  },
  {
    id: 5,
    title: "Configure Build Settings",
    description: "Set up the build settings for your project and deploy.",
    details: [
      "Project name: Choose a name for your site (e.g., my-openpress-site)",
      "Production branch: main",
      "Build command: npm run build",
      "Build output directory: dist",
      "Optionally add Environment variables (advanced) — see Step 6",
      '"Save and Deploy"',
      "Wait for the build to complete (usually under 30 seconds)",
    ],
    note: "OpenPress uses npm script aliases in package.json, so `npm run build` maps to the Vite build command. Cloudflare Pages will automatically install dependencies and run the build.",
  },
  {
    id: 6,
    title: "Set Environment Variables",
    description: "Add the required environment variables for D1, R2, KV, and JWT.",
    details: [
      "Go to your Pages project > Settings > Environment variables",
      'Click "Add variable" for each of the following:',
    ],
    code: `# Required Variables
CLOUDFLARE_D1_DATABASE_NAME=openpress-db
CLOUDFLARE_D1_DATABASE_ID=<your-database-id>

# JWT Configuration
JWT_SECRET=<generate-a-random-secret-string>

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Optional: Workers AI (built-in, no key needed)`,
    note: 'The JWT_SECRET should be a long random string. Generate one with: `openssl rand -base64 32`.',
  },
  {
    id: 7,
    title: "Create D1 Database",
    description: "Create a Cloudflare D1 SQLite database and bind it to your Pages project.",
    details: [
      'Go to https://dash.cloudflare.com and navigate to "Workers & Pages" > "D1"',
      'Click "Create database"',
      "Database name: openpress-db",
      'Click "Create"',
      "Copy the Database ID from the database details page",
      "Go back to your Pages project > Settings > Functions > D1 database bindings",
      "Add a binding: Variable name = DB, D1 database = openpress-db",
    ],
  },
  {
    id: 8,
    title: "Create R2 Storage Bucket",
    description: "Set up an R2 bucket for media file uploads.",
    details: [
      'In the Cloudflare dashboard, go to "R2 Object Storage"',
      'Click "Create bucket"',
      "Bucket name: openpress-media",
      "Select a location (or leave as default)",
      'Click "Create bucket"',
      "Go to your Pages project > Settings > Functions > R2 bucket bindings",
      "Add a binding: Variable name = MEDIA_BUCKET, R2 bucket = openpress-media",
    ],
  },
  {
    id: 9,
    title: "Create KV Namespace",
    description: "Set up a KV namespace for caching.",
    details: [
      'In the Cloudflare dashboard, go to "Workers & Pages" > "KV"',
      'Click "Create a namespace"',
      "Namespace name: openpress-cache",
      'Click "Add"',
      "Copy the Namespace ID",
      "Go to your Pages project > Settings > Functions > KV namespace bindings",
      "Add a binding: Variable name = KV_CACHE, KV namespace = openpress-cache",
    ],
  },
  {
    id: 10,
    title: "Run Database Migrations",
    description: "Apply the SQL schema to create all required tables in your D1 database.",
    details: [
      "Install Wrangler CLI globally: npm install -g wrangler",
      "Log in to Cloudflare: npx wrangler login",
      "Run each migration file in order:",
    ],
    code: `# Apply migrations in order
npx wrangler d1 execute openpress-db --file=schema/001_initial.sql --remote
npx wrangler d1 execute openpress-db --file=schema/002_products.sql --remote
npx wrangler d1 execute openpress-db --file=schema/003_orders.sql --remote
npx wrangler d1 execute openpress-db --file=schema/004_settings.sql --remote
npx wrangler d1 execute openpress-db --file=schema/005_ai.sql --remote
npx wrangler d1 execute openpress-db --file=schema/006_seo.sql --remote
npx wrangler d1 execute openpress-db --file=schema/007_comments.sql --remote
npx wrangler d1 execute openpress-db --file=schema/008_revisions.sql --remote
npx wrangler d1 execute openpress-db --file=schema/009_cron.sql --remote
npx wrangler d1 execute openpress-db --file=schema/010_media.sql --remote
npx wrangler d1 execute openpress-db --file=schema/011_taxonomies.sql --remote
npx wrangler d1 execute openpress-db --file=schema/012_users.sql --remote
npx wrangler d1 execute openpress-db --file=schema/013_roles.sql --remote
npx wrangler d1 execute openpress-db --file=schema/014_navigation.sql --remote
npx wrangler d1 execute openpress-db --file=schema/015_stripe.sql --remote
npx wrangler d1 execute openpress-db --file=schema/016_templates.sql --remote
npx wrangler d1 execute openpress-db --file=schema/017_hero_slides.sql --remote`,
    note: "The --remote flag applies to your production D1 database. Remove it to apply to your local dev database instead.",
  },
  {
    id: 11,
    title: "Deploy and Launch",
    description: "Deploy your site and set up your admin account.",
    details: [
      'If you haven\'t already, go back to your Pages project and click "Save and Deploy"',
      "Wait for the build to complete (usually under 30 seconds)",
      "Visit your site at: https://<your-project-name>.pages.dev",
      "Navigate to /login and register your admin account",
      "Promote your user to admin role (see command below)",
      "Log out and log back in — you'll now have full admin access",
    ],
    code: `# Promote your user to admin
npx wrangler d1 execute openpress-db \\
  --command="UPDATE users SET role = 'admin' WHERE email = 'your@email.com'" \\
  --remote`,
    note: "By default, new users register as 'subscriber' role. You need to promote at least one user to 'admin'.",
  },
  {
    id: 12,
    title: "Optional: Configure Custom Domain",
    description: "Point your own domain to your Cloudflare Pages site.",
    details: [
      "Go to your Pages project > Custom domains",
      'Click "Set up a custom domain"',
      "Enter your domain name (e.g., blog.example.com)",
      "Follow the DNS configuration instructions",
      "Cloudflare will automatically provision an SSL certificate",
      "Your site will be available at your custom domain within minutes",
    ],
    note: "Your domain must be using Cloudflare DNS (nameservers pointing to Cloudflare) for automatic SSL provisioning.",
  },
];

export function Tutorial() {
  useSEO({ title: "Setup Tutorial", description: "Step-by-step guide to deploy OpenPress on Cloudflare", type: "website" });
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expandedCode, setExpandedCode] = useState<number | null>(null);

  // The active step is the first uncompleted step, or the last step if all done
  const activeStepId = useMemo(() => {
    for (const s of steps) {
      if (!completed.has(s.id)) return s.id;
    }
    return steps[steps.length - 1].id;
  }, [completed]);

  const completeStep = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setExpandedCode(null);
  };

  const uncompleteStep = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setExpandedCode(null);
  };

  const toggleCode = (id: number) => {
    setExpandedCode((prev) => (prev === id ? null : id));
  };

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <div className="bg-surface flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface-secondary shrink-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-text-primary">Setup Tutorial</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Deploy OpenPress on Cloudflare Pages in minutes. Complete each step to proceed.
          </p>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-text-tertiary mb-1.5">
              <span>{completed.size} of {steps.length} steps completed</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps — only active step expanded */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full">
        <div className="space-y-2">
          {steps.map((step) => {
            const isDone = completed.has(step.id);
            const isActive = step.id === activeStepId && !isDone;
            const isExpanded = isActive;

            return (
              <div
                key={step.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isDone
                    ? "border-green-200 bg-green-50/30"
                    : isActive
                      ? "border-primary-300 bg-primary-50/30 shadow-sm"
                      : "border-border bg-surface"
                }`}
              >
                {/* Step header — always visible */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => isDone ? uncompleteStep(step.id) : completeStep(step.id)}
                    className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all text-xs ${
                      isDone
                        ? "border-green-500 bg-green-500 text-white"
                        : isActive
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-border text-text-tertiary"
                    }`}
                    title={isDone ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {isDone ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="font-bold">{step.id}</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium ${isDone ? "text-green-700 line-through" : "text-text-primary"}`}>
                      {step.title}
                    </h3>
                    {!isExpanded && (
                      <p className="text-xs text-text-tertiary mt-0.5 truncate">{step.description}</p>
                    )}
                  </div>
                  {isExpanded && (
                    <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {!isExpanded && !isDone && (
                    <span className="text-[10px] text-text-tertiary shrink-0">Step {step.id}</span>
                  )}
                </div>

                {/* Step details — only for active step */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-13 border-t border-border/50">
                    <p className="text-sm text-text-secondary mt-3 mb-3">{step.description}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-primary-400 mt-1 shrink-0">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Code block */}
                    {step.code && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleCode(step.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium mb-1.5"
                        >
                          {expandedCode === step.id ? "Hide" : "Show"} commands
                        </button>
                        {expandedCode === step.id && (
                          <div className="relative">
                            <button
                              onClick={() => navigator.clipboard.writeText(step.code!)}
                              className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                              title="Copy to clipboard"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                            <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{step.code}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Note */}
                    {step.note && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                        <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                        <p className="text-xs text-blue-700">{step.note}</p>
                      </div>
                    )}

                    {/* Complete button */}
                    <button
                      onClick={() => completeStep(step.id)}
                      className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                    >
                      Mark as complete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
