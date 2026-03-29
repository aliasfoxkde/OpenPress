// Core content types
export interface ContentItem {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  content?: string;
  excerpt?: string;
  status: ContentStatus;
  author_id?: string;
  featured_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export type ContentType = "post" | "page" | "product" | "custom";
export type ContentStatus = "draft" | "published" | "scheduled" | "archived" | "trash";

export interface ContentBlock {
  id: string;
  content_id: string;
  block_type: BlockType;
  data: Record<string, unknown>;
  sort_order: number;
  parent_block_id?: string;
  created_at: string;
  updated_at: string;
}

export type BlockType =
  | "text"
  | "heading"
  | "image"
  | "code"
  | "quote"
  | "list"
  | "divider"
  | "embed"
  | "component"
  | "gallery"
  | "video"
  | "audio"
  | "custom";

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = "admin" | "editor" | "author" | "contributor" | "subscriber" | "viewer";

// Taxonomy types
export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  type: "flat" | "hierarchical";
  description?: string;
  created_at: string;
}

export interface Term {
  id: string;
  taxonomy_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  created_at: string;
}

// Media types
export interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  r2_key: string;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
  uploaded_by?: string;
  created_at: string;
}

// Plugin types
export interface Plugin {
  id: string;
  name: string;
  slug: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  installed_at: string;
  updated_at: string;
}

// Theme types
export interface Theme {
  id: string;
  name: string;
  slug: string;
  version: string;
  description?: string;
  author?: string;
  is_active: boolean;
  config: ThemeConfig;
  installed_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  layouts?: string[];
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  [key: string]: unknown;
}

// API types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Hook types (plugin system)
export type HookAction = "beforeCreate" | "afterCreate" | "beforeUpdate" | "afterUpdate" | "beforeDelete" | "afterDelete" | "beforeRender" | "afterRender";
export type HookFilter = "contentData" | "pageTitle" | "excerpt" | "permalink" | "response";

export type ActionHook = (context: HookContext) => Promise<void> | void;
export type FilterHook<T = unknown> = (value: T, context: HookContext) => Promise<T> | T;

export interface HookContext {
  type: string;
  data: Record<string, unknown>;
  user?: AuthUser;
  [key: string]: unknown;
}

// Site settings
export interface SiteSettings {
  site_name: string;
  site_description: string;
  permalink_structure: string;
  default_role: UserRole;
  posts_per_page: number;
  allow_registration: boolean;
  [key: string]: unknown;
}
