/**
 * Shared SEO handler logic used by both /api/seo routes and root-level routes.
 * Root-level routes (/sitemap.xml, /feed.xml, /robots.txt) are handled by
 * separate function files for proper SEO URL structure.
 */
import type { Bindings, Variables } from "../api/lib/types";

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  JWT_SECRET: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSiteUrl(c: { request: Request }): string {
  const host = c.request.headers.get("Host");
  return host ? `https://${host}` : "https://openpress.pages.dev";
}

export async function handleSitemap(context: EventContext<Bindings, string, Record<string, unknown>>): Promise<Response> {
  const db = context.env.DB;

  const [contentItems, products] = await Promise.all([
    db
      .prepare(
        `SELECT slug, updated_at, published_at, type FROM content_items WHERE status = 'published' ORDER BY published_at DESC`
      )
      .all(),
    db
      .prepare(
        `SELECT slug, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC`
      )
      .all(),
  ]);

  const siteUrl = getSiteUrl(context);

  const contentUrls = (contentItems.results as Array<{ slug: string; updated_at: string; published_at: string; type: string }>).map((item) => {
    const lastmod = item.updated_at || item.published_at || new Date().toISOString();
    const path = item.type === "page" ? `/${item.slug}` : `/blog/${item.slug}`;
    return `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>${item.type === "page" ? "monthly" : "weekly"}</changefreq>
    <priority>${item.type === "page" ? "0.8" : "0.6"}</priority>
  </url>`;
  });

  const productUrls = (products.results as Array<{ slug: string; updated_at: string }>).map((item) => {
    const lastmod = item.updated_at || new Date().toISOString();
    return `  <url>
    <loc>${siteUrl}/shop/${item.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
  });

  const urls = [...contentUrls, ...productUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function handleFeed(context: EventContext<Bindings, string, Record<string, unknown>>): Promise<Response> {
  const db = context.env.DB;

  const items = await db
    .prepare(
      `SELECT ci.slug, ci.title, ci.excerpt, ci.content, ci.published_at, ci.updated_at, u.name as author_name
       FROM content_items ci LEFT JOIN users u ON ci.author_id = u.id
       WHERE ci.status = 'published' ORDER BY ci.published_at DESC LIMIT 20`
    )
    .all();

  const settings = await db
    .prepare("SELECT key, value FROM settings WHERE key IN ('site_name', 'site_description')")
    .all();
  const siteSettings: Record<string, string> = {};
  for (const row of settings.results as { key: string; value: string }[]) {
    siteSettings[row.key] = row.value;
  }

  const siteName = siteSettings.site_name || "OpenPress";
  const siteDesc = siteSettings.site_description || "A modern, edge-native CMS";
  const siteUrl = getSiteUrl(context);
  const buildDate = new Date().toUTCString();

  const itemsXml = (items.results as Array<{ slug: string; title: string; excerpt: string; content: string; published_at: string; author_name: string }>).map((item) => {
    const description = item.excerpt || item.content?.substring(0, 200) || "";
    const pubDate = new Date(item.published_at).toUTCString();
    return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${siteUrl}/blog/${item.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${item.slug}</guid>
      <description>${escapeXml(description)}</description>
      ${item.author_name ? `<dc:creator>${escapeXml(item.author_name)}</dc:creator>` : ""}
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>OpenPress CMS</generator>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function handleRobots(context: EventContext<Bindings, string, Record<string, unknown>>): Promise<Response> {
  const siteUrl = getSiteUrl(context);

  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
