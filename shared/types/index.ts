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
export type ProductType = "simple" | "composite" | "variable" | "digital";
export type ContentStatus = "draft" | "published" | "scheduled" | "archived" | "trash" | "pending";

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

// Composite product types
export interface CompositeProduct {
  id: string;
  product_id: string;
  base_price: number;
  min_price: number | null;
  max_price: number | null;
  price_display: "range" | "from" | "hidden";
  layout: "accordion" | "wizard" | "tabs" | "grid";
  shop_page_thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompositeComponent {
  id: string;
  composite_id: string;
  title: string;
  description: string | null;
  is_required: number;
  selection_type: "single" | "multi";
  min_quantity: number;
  max_quantity: number;
  display_mode: "thumbnail" | "dropdown" | "swatch" | "radio";
  sort_order: number;
  options?: CompositeComponentOption[];
}

export interface CompositeComponentOption {
  id: string;
  component_id: string;
  product_id: string;
  is_default: number;
  price_override: number | null;
  price_override_type: "fixed" | "discount" | "markup" | null;
  price_override_value: number | null;
  sort_order: number;
  base_product_price?: number;
  product_title?: string;
  product_slug?: string;
  product_image?: string;
  product_sku?: string;
  product_inventory?: number;
}

export interface CompositeScenario {
  id: string;
  composite_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_default: number;
  sort_order: number;
  defaults?: CompositeScenarioDefault[];
}

export interface CompositeScenarioDefault {
  id: string;
  scenario_id: string;
  component_id: string;
  option_id: string | null;
  is_hidden: number;
  option_title?: string;
}

export interface CompositeCompatRule {
  id: string;
  composite_id: string;
  component_id: string;
  option_id: string;
  incompatible_component_id: string;
  incompatible_option_id: string;
  message: string | null;
}
