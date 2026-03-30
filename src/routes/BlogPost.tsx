import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useSEO } from "@/hooks/useSEO";

/** Strip dangerous elements/attributes from HTML to prevent XSS */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/ on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/ on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "");
}

interface ContentBlock {
  id: string;
  block_type: string;
  content: string;
  sort_order: number;
  data: Record<string, unknown>;
  attributes: string;
}

interface ContentItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  status: string;
  published_at: string;
  created_at: string;
  author_name?: string;
  blocks: ContentBlock[];
  meta: Record<string, string>;
  terms?: Term[];
}

interface Term {
  id: string;
  name: string;
  slug: string;
  taxonomy_id: string;
}

export function BlogPostPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const [post, setPost] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await api.get(`/api/content/${slug}`);
        setPost(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Post not found");
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadPost();
  }, [slug]);

  // SEO meta tags
  useSEO({
    title: post?.title,
    description: post?.excerpt || post?.content?.substring(0, 160),
    image: post?.featured_image_url || undefined,
    url: `${window.location.origin}/blog/${slug}`,
    type: "article",
    author: post?.author_name,
    publishedTime: post?.published_at,
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-surface-secondary rounded w-3/4 mb-4" />
        <div className="h-4 bg-surface-secondary rounded w-1/4 mb-8" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-surface-secondary rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Reading time estimate (~200 words per minute)
  const wordCount = post.content ? post.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Post Not Found</h1>
        <p className="mt-2 text-text-secondary">{error}</p>
        <Link to="/blog" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-text-tertiary">
        <Link to="/" className="hover:text-text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-text-primary">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{post.title}</span>
      </nav>

      {/* Hero image */}
      {post.featured_image_url && (
        <div className="aspect-video rounded-xl overflow-hidden mb-8">
          <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary">{post.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-text-tertiary">
          <time>
            {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.author_name && (
            <span className="text-text-secondary">by {post.author_name}</span>
          )}
          <span className="text-text-tertiary">{readingTime} min read</span>
          <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 capitalize">
            {post.type}
          </span>
        </div>
        {post.terms && post.terms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.terms.map((term) => (
              <Link
                key={term.id}
                to="/blog"
                search={{ category: term.slug }}
                className="inline-flex items-center rounded-full bg-surface-secondary border border-border px-3 py-0.5 text-xs text-text-secondary hover:text-primary-600 hover:border-primary-300 transition-colors"
              >
                {term.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
      {post.meta?.blocknote_json ? (
        <BlockNoteRenderer json={post.meta.blocknote_json} />
      ) : (
        <>
          {post.content && (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
          )}

          {/* Legacy Blocks */}
          {post.blocks && post.blocks.length > 0 && (
            <div className="mt-8 space-y-6">
              {post.blocks
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
          )}
        </>
      )}

      {/* Comments Section */}
      <CommentsSection slug={slug} />
        </div>

        {/* Table of Contents (sidebar) */}
        <TableOfContents post={post} />
      </div>
    </article>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  // Use block.data if available (newer format), fall back to content/attributes
  const data = block.data || {};
  const content = block.content || String(data.text || data.code || "");

  switch (block.block_type) {
    case "text":
      return (
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      );
    case "heading": {
      const level = (data.level as number) || 2;
      const sizeClass = level === 1 ? "text-4xl" : level === 2 ? "text-3xl" : level === 3 ? "text-2xl" : "text-xl";
      const headingId = content.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      return <Tag id={headingId} className={`${sizeClass} font-bold text-text-primary`}>{content}</Tag>;
    }
    case "image":
      return (
        <figure className="rounded-xl overflow-hidden">
          <img src={String(data.url || content)} alt={String(data.alt || "")} className="w-full" />
          {data.caption && <figcaption className="text-sm text-text-tertiary mt-2 text-center">{String(data.caption)}</figcaption>}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary-300 pl-4 italic text-text-secondary">
          {content}
        </blockquote>
      );
    case "code":
      return (
        <pre className="rounded-lg bg-text-primary p-4 overflow-x-auto">
          <code className="text-sm text-surface">{String(data.code || content)}</code>
        </pre>
      );
    case "list": {
      const items = (data.items as string[]) || content.split("\n");
      const ordered = data.ordered as boolean;
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag className={ordered ? "list-decimal pl-6 space-y-1 text-text-secondary" : "list-disc pl-6 space-y-1 text-text-secondary"}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    default:
      return (
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      );
  }
}

/** Renders BlockNote JSON blocks for public blog display */
function BlockNoteRenderer({ json }: { json: string }) {
  let blocks: BlockNoteBlock[];
  try {
    blocks = JSON.parse(json);
  } catch {
    return <div className="text-red-500">Failed to parse content</div>;
  }

  if (!Array.isArray(blocks)) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <BlockNoteBlockRenderer key={block.id || i} block={block} />
      ))}
    </div>
  );
}

interface BlockNoteBlock {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: Array<{ type: string; text?: string; styles?: Record<string, unknown> }>;
  children?: BlockNoteBlock[];
}

function extractText(content?: BlockNoteBlock["content"]): string {
  if (!content || !Array.isArray(content)) return "";
  return content
    .filter((c): c is { type: string; text: string } => typeof c === "object" && "text" in c)
    .map((c) => c.text)
    .join("");
}

function BlockNoteBlockRenderer({ block }: { block: BlockNoteBlock }) {
  const type = block.type || "paragraph";
  const text = extractText(block.content);
  const props = block.props || {};

  switch (type) {
    case "heading": {
      const level = (props.level as number) || 2;
      const sizeClass = level === 1 ? "text-4xl" : level === 2 ? "text-3xl" : level === 3 ? "text-2xl" : "text-xl";
      const headingId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      return <Tag id={headingId} className={`${sizeClass} font-bold text-text-primary`}>{text}</Tag>;
    }
    case "bulletListItem":
      return <li className="list-disc ml-6 text-text-secondary">{text}</li>;
    case "numberedListItem":
      return <li className="list-decimal ml-6 text-text-secondary">{text}</li>;
    case "image":
      return (
        <figure className="rounded-xl overflow-hidden">
          <img src={String(props.url || "")} alt={String(props.alt || "")} className="w-full" />
          {props.caption && <figcaption className="text-sm text-text-tertiary mt-2 text-center">{String(props.caption)}</figcaption>}
        </figure>
      );
    case "codeBlock":
      return (
        <pre className="rounded-lg bg-text-primary p-4 overflow-x-auto">
          <code className="text-sm text-surface">{text}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary-300 pl-4 italic text-text-secondary">
          {text}
        </blockquote>
      );
    case "paragraph":
    default:
      if (!text) return <div className="h-4" />; // empty paragraph spacer
      return <p className="text-text-secondary leading-relaxed">{text}</p>;
  }
}

// ─── Table of Contents ────────────────────────────────────────────────────

function extractHeadings(post: ContentItem): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];

  // From BlockNote JSON
  if (post.meta?.blocknote_json) {
    try {
      const blocks: BlockNoteBlock[] = JSON.parse(post.meta.blocknote_json);
      for (const block of blocks) {
        if (block.type === "heading") {
          const level = (block.props?.level as number) || 2;
          const text = extractText(block.content);
          if (text) {
            headings.push({
              id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
              text,
              level,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // From legacy HTML
  if (headings.length === 0 && post.content) {
    const matches = post.content.matchAll(/<h([2-4])[^>]*>(.*?)<\/h\1>/gi);
    for (const match of matches) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        headings.push({
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          text,
          level: parseInt(match[1]),
        });
      }
    }
  }

  return headings;
}

function TableOfContents({ post }: { post: ContentItem }) {
  const headings = extractHeadings(post);
  if (headings.length < 2) return null;

  return (
    <nav className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-20">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          On this page
        </h3>
        <ul className="space-y-1.5 text-sm border-l border-border pl-3">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block text-text-secondary hover:text-primary-600 transition-colors truncate ${h.level > 2 ? "pl-3 text-xs" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// ─── Comments Section ─────────────────────────────────────────────────────

interface Comment {
  id: string;
  author_name: string;
  body: string;
  parent_id: string | null;
  reply_count: number;
  created_at: string;
}

function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get<{ data: Comment[] }>(`/comments/${slug}`);
      setComments(res.data || []);
    } catch {
      // Silently fail - comments are optional
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await api.post(`/comments/${slug}`, {
        author_name: name.trim(),
        author_email: email.trim() || undefined,
        body: body.trim(),
      });
      setName("");
      setEmail("");
      setBody("");
      setMessage("Comment submitted for moderation.");
      void fetchComments();
    } catch {
      setMessage("Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold text-text-primary mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="text-sm text-text-tertiary">Loading comments...</div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-text-tertiary mb-6">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments
            .filter((c) => !c.parent_id)
            .map((comment) => (
              <div key={comment.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">{comment.author_name}</span>
                    <span className="text-xs text-text-tertiary ml-2">{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary ml-10">{comment.body}</p>
              </div>
            ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary">Leave a comment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name *"
            required
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your comment..."
          required
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
        {message && (
          <p className="text-sm text-text-tertiary">{message}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !name.trim() || !body.trim()}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting..." : "Post Comment"}
        </button>
      </form>
    </section>
  );
}
