export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  JWT_SECRET?: string;
  CRON_SECRET?: string;
};

export type Variables = {
  user: { id: string; email: string; role: string } | null;
};
