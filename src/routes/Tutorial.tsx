import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  code?: string;
  note?: string;
  screenshot?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Fork the OpenPress Repository",
    description: "Start by forking the OpenPress repo on GitHub to your own account.",
    details: [
      "Go to https://github.com/aliasfoxkde/OpenPress",
      "Click the \"Fork\" button in the top-right corner",
      "Select your GitHub account as the destination",
      "Click \"Create fork\" to create your copy",
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
      "In the left sidebar, click on \"Workers & Pages\" under the \"Compute\" section",
      "If it's your first time, you may see a welcome screen — click \"Get Started\"",
    ],
  },
  {
    id: 4,
    title: "Create a New Application",
    description: "Connect your GitHub repository to Cloudflare Pages.",
    details: [
      "Click the blue \"Create\" button",
      "Click \"Continue with GitHub\" (sign up or set up if needed)",
      "Select your GitHub account (if you have multiple)",
      "Find and select the \"OpenPress\" repository you forked",
      "Click \"Next\"",
    ],
  },
  {
    id: 5,
    title: "Configure Build Settings",
    description: "Set up the build and deploy commands for your project.",
    details: [
      "Project name: Choose a name for your site (e.g., my-openpress-site)",
      "Production branch: main",
      "Build command: npm run build",
      "Build output directory: dist",
      "Root directory: /",
      "Click \"+ Create new token\" for the API token (or use an existing one)",
      "API token name: Use your project name",
      "Click \"Save and Deploy\"",
    ],
    note: "OpenPress uses npm script aliases in package.json, so `npm run build` maps to the Vite build command. The output directory is `dist` (Vite's default). Cloudflare Pages will automatically install dependencies and run the build.",
  },
  {
    id: 6,
    title: "Set Environment Variables",
    description: "Add the required environment variables for D1, R2, KV, and JWT.",
    details: [
      "Go to your Pages project > Settings > Environment variables",
      "Click \"Add variable\" for each of the following:",
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
    note: "The JWT_SECRET should be a long random string. Generate one with: `openssl rand -base64 32`. For Stripe, you'll need a Stripe account at https://dashboard.stripe.com. Workers AI uses Cloudflare's built-in model — no external API key required.",
  },
  {
    id: 7,
    title: "Create D1 Database",
    description: "Create a Cloudflare D1 SQLite database and bind it to your Pages project.",
    details: [
      "Go to https://dash.cloudflare.com and navigate to \"Workers & Pages\" > \"D1\"",
      "Click \"Create database\"",
      "Database name: openpress-db",
      "Click \"Create\"",
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
      "In the Cloudflare dashboard, go to \"R2 Object Storage\"",
      "Click \"Create bucket\"",
      "Bucket name: openpress-media",
      "Select a location (or leave as default)",
      "Click \"Create bucket\"",
      "Go to your Pages project > Settings > Functions > R2 bucket bindings",
      "Add a binding: Variable name = MEDIA_BUCKET, R2 bucket = openpress-media",
    ],
  },
  {
    id: 9,
    title: "Create KV Namespace",
    description: "Set up a KV namespace for caching.",
    details: [
      "In the Cloudflare dashboard, go to \"Workers & Pages\" > \"KV\"",
      "Click \"Create a namespace\"",
      "Namespace name: openpress-cache",
      "Click \"Add\"",
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
    note: "The --remote flag applies to your production D1 database. Remove it to apply to your local dev database instead. You can also run all migrations from the Cloudflare D1 console in the dashboard.",
  },
  {
    id: 11,
    title: "Deploy and Launch",
    description: "Deploy your site and set up your admin account.",
    details: [
      "If you haven't already, go back to your Pages project and click \"Save and Deploy\"",
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
    note: "By default, new users register as 'subscriber' role. You need to promote at least one user to 'admin' to access the full admin dashboard. Alternatively, you can update the role directly in the Cloudflare D1 console.",
  },
  {
    id: 12,
    title: "Optional: Configure Custom Domain",
    description: "Point your own domain to your Cloudflare Pages site.",
    details: [
      "Go to your Pages project > Custom domains",
      "Click \"Set up a custom domain\"",
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

  const toggleStep = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCode = (id: number) => {
    setExpandedCode((prev) => (prev === id ? null : id));
  };

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface-secondary">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text-primary">Setup Tutorial</h1>
          <p className="mt-2 text-text-secondary">
            Deploy OpenPress on Cloudflare Pages in minutes. Follow each step to get your site live.
          </p>
          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
              <span>{completed.size} of {steps.length} steps completed</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {steps.map((step) => {
            const isDone = completed.has(step.id);
            return (
              <div
                key={step.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isDone ? "border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10" : "border-border bg-surface"
                }`}
              >
                {/* Step header */}
                <div className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`mt-0.5 w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-border hover:border-primary-400"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-text-tertiary">{step.id}</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${isDone ? "text-green-700 dark:text-green-300 line-through" : "text-text-primary"}`}>
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">{step.description}</p>
                  </div>
                </div>

                {/* Step details */}
                <div className="px-5 pb-5 pl-16">
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-primary-400 mt-1 shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Code block */}
                  {step.code && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleCode(step.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium mb-2"
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
                          <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{step.code}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  {step.note && (
                    <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                      </svg>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{step.note}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Troubleshooting */}
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            {[
              {
                q: "Build fails with 'module not found'",
                a: "Make sure you're using Node.js 18+ and run npm install before deploying. Cloudflare Pages should install dependencies automatically, but if it doesn't, add a pre-build script.",
              },
              {
                q: "Site loads but shows 404 on API calls",
                a: "Verify that your D1, R2, and KV bindings are correctly configured in the Pages project settings under Functions > Bindings.",
              },
              {
                q: "Can't log in after registering",
                a: "New users register as 'subscriber' role by default. You need to promote your user to 'admin' using the D1 console (see Step 11 for the SQL command).",
              },
              {
                q: "Media uploads fail",
                a: "Check that the R2 bucket binding (MEDIA_BUCKET) is configured. Also verify the bucket name matches exactly.",
              },
            ].map((item) => (
              <div key={item.q} className="p-4 rounded-lg border border-border bg-surface">
                <h4 className="font-medium text-text-primary text-sm">{item.q}</h4>
                <p className="mt-1 text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
