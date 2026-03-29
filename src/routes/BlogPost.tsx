import { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../lib/api";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string;
  sort_order: number;
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
  blocks: ContentBlock[];
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
      {post.content && (
        <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      )}

      {/* Blocks */}
      {post.blocks && post.blocks.length > 0 && (
        <div className="mt-8 space-y-6">
          {post.blocks
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
        </div>
      )}
    </article>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.block_type) {
    case "text":
      return (
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
      );
    case "heading":
      return <h2 className="text-2xl font-bold text-gray-900">{block.content}</h2>;
    case "image":
      return (
        <figure className="rounded-xl overflow-hidden">
          <img src={block.content} alt="" className="w-full" />
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600">
          {block.content}
        </blockquote>
      );
    case "code":
      return (
        <pre className="rounded-lg bg-gray-900 p-4 overflow-x-auto">
          <code className="text-sm text-gray-100">{block.content}</code>
        </pre>
      );
    case "list":
      return (
        <ul className="list-disc pl-6 space-y-1 text-gray-700">
          {block.content.split("\n").map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    default:
      return (
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
      );
  }
}
