import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const seo = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /sitemap.xml - XML Sitemap listing all published content
seo.get("/sitemap.xml", async (c) => {
  const db = c.env.DB;
  if (!db) return c.text("Database not configured", 503);

  const items = await db
    .prepare(
      `SELECT slug, updated_at, published_at, type FROM content_items WHERE status = 'published' ORDER BY published_at DESC`
    )
    .all();

  const siteUrl = c.req.header("Host")
    ? `https://${c.req.header("Host")}`
    : "https://openpress.pages.dev";

  const urls = items.results.map((item: { slug: string; updated_at: string; published_at: string; type: string }) => {
    const lastmod = item.updated_at || item.published_at || new Date().toISOString();
    const path = item.type === "page" ? `/${item.slug}` : `/blog/${item.slug}`;
    return `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>${item.type === "page" ? "monthly" : "weekly"}</changefreq>
    <priority>${item.type === "page" ? "0.8" : "0.6"}</priority>
  </url>`;
  });

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

  return c.text(xml, 200, { "Content-Type": "application/xml" });
});

// GET /feed.xml - RSS 2.0 feed with latest 20 posts
seo.get("/feed.xml", async (c) => {
  const db = c.env.DB;
  if (!db) return c.text("Database not configured", 503);

  const items = await db
    .prepare(
      `SELECT ci.slug, ci.title, ci.excerpt, ci.content, ci.published_at, ci.updated_at, u.name as author_name
       FROM content_items ci LEFT JOIN users u ON ci.author_id = u.id
       WHERE ci.status = 'published' ORDER BY ci.published_at DESC LIMIT 20`
    )
    .all();

  // Get site settings
  const settings = await db
    .prepare("SELECT key, value FROM settings WHERE key IN ('site_name', 'site_description')")
    .all();
  const siteSettings: Record<string, string> = {};
  for (const row of settings.results as { key: string; value: string }[]) {
    siteSettings[row.key] = row.value;
  }

  const siteName = siteSettings.site_name || "OpenPress";
  const siteDesc = siteSettings.site_description || "A modern, edge-native CMS";
  const siteUrl = c.req.header("Host")
    ? `https://${c.req.header("Host")}`
    : "https://openpress.pages.dev";
  const buildDate = new Date().toUTCString();

  const items_xml = (items.results as Array<{ slug: string; title: string; excerpt: string; content: string; published_at: string; author_name: string }>).map((item) => {
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
${items_xml}
  </channel>
</rss>`;

  return c.text(xml, 200, { "Content-Type": "application/xml" });
});

// GET /robots.txt
seo.get("/robots.txt", async (c) => {
  const siteUrl = c.req.header("Host")
    ? `https://${c.req.header("Host")}`
    : "https://openpress.pages.dev";

  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;

  return c.text(txt, 200, { "Content-Type": "text/plain" });
});

// GET /search - Full-text search endpoint
seo.get("/search", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ error: { message: "Query must be at least 2 characters", code: "VALIDATION" } }, 400);
  }

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  // Use LIKE-based search (FTS5 requires separate virtual table setup)
  const searchPattern = `%${q.trim()}%`;
  const items = await db
    .prepare(
      `SELECT id, type, slug, title, excerpt, status, published_at, created_at, updated_at,
              CASE WHEN title LIKE ? THEN 3 ELSE 0 END + CASE WHEN excerpt LIKE ? THEN 1 ELSE 0 END as relevance
       FROM content_items
       WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
       ORDER BY relevance DESC, published_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset)
    .all();

  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as total FROM content_items WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)`
    )
    .bind(searchPattern, searchPattern, searchPattern)
    .first<{ total: number }>();

  return c.json({
    data: items.results,
    query: q,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default seo;
