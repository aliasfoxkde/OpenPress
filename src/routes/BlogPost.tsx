import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useSEO } from "@/hooks/useSEO";

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
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Post Not Found</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link to="/blog" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-gray-700">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{post.title}</span>
      </nav>

      {/* Hero image */}
      {post.featured_image_url && (
        <div className="aspect-video rounded-xl overflow-hidden mb-8">
          <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <time>
            {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 capitalize">
            {post.type}
          </span>
        </div>
      </header>

      {/* Content */}
      {post.meta?.blocknote_json ? (
        <BlockNoteRenderer json={post.meta.blocknote_json} />
      ) : (
        <>
          {post.content && (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
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
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      );
    case "heading": {
      const level = (data.level as number) || 2;
      const sizeClass = level === 1 ? "text-4xl" : level === 2 ? "text-3xl" : level === 3 ? "text-2xl" : "text-xl";
      if (level === 1) return <h1 className={`${sizeClass} font-bold text-gray-900`}>{content}</h1>;
      if (level === 2) return <h2 className={`${sizeClass} font-bold text-gray-900`}>{content}</h2>;
      if (level === 3) return <h3 className={`${sizeClass} font-bold text-gray-900`}>{content}</h3>;
      if (level === 4) return <h4 className={`${sizeClass} font-bold text-gray-900`}>{content}</h4>;
      return <h2 className={`${sizeClass} font-bold text-gray-900`}>{content}</h2>;
    }
    case "image":
      return (
        <figure className="rounded-xl overflow-hidden">
          <img src={String(data.url || content)} alt={String(data.alt || "")} className="w-full" />
          {data.caption && <figcaption className="text-sm text-gray-500 mt-2 text-center">{String(data.caption)}</figcaption>}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600">
          {content}
        </blockquote>
      );
    case "code":
      return (
        <pre className="rounded-lg bg-gray-900 p-4 overflow-x-auto">
          <code className="text-sm text-gray-100">{String(data.code || content)}</code>
        </pre>
      );
    case "list": {
      const items = (data.items as string[]) || content.split("\n");
      const ordered = data.ordered as boolean;
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag className={ordered ? "list-decimal pl-6 space-y-1 text-gray-700" : "list-disc pl-6 space-y-1 text-gray-700"}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    default:
      return (
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
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
      if (level === 1) return <h1 className={`${sizeClass} font-bold text-gray-900`}>{text}</h1>;
      if (level === 2) return <h2 className={`${sizeClass} font-bold text-gray-900`}>{text}</h2>;
      if (level === 3) return <h3 className={`${sizeClass} font-bold text-gray-900`}>{text}</h3>;
      if (level === 4) return <h4 className={`${sizeClass} font-bold text-gray-900`}>{text}</h4>;
      return <h2 className={`${sizeClass} font-bold text-gray-900`}>{text}</h2>;
    }
    case "bulletListItem":
      return <li className="list-disc ml-6 text-gray-700">{text}</li>;
    case "numberedListItem":
      return <li className="list-decimal ml-6 text-gray-700">{text}</li>;
    case "image":
      return (
        <figure className="rounded-xl overflow-hidden">
          <img src={String(props.url || "")} alt={String(props.alt || "")} className="w-full" />
          {props.caption && <figcaption className="text-sm text-gray-500 mt-2 text-center">{String(props.caption)}</figcaption>}
        </figure>
      );
    case "codeBlock":
      return (
        <pre className="rounded-lg bg-gray-900 p-4 overflow-x-auto">
          <code className="text-sm text-gray-100">{text}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600">
          {text}
        </blockquote>
      );
    case "paragraph":
    default:
      if (!text) return <div className="h-4" />; // empty paragraph spacer
      return <p className="text-gray-700 leading-relaxed">{text}</p>;
  }
}
