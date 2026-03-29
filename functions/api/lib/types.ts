export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
};

export type Variables = {
  user: { id: string; email: string; role: string } | null;
};
