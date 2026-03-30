import { handleSitemap } from "./lib/seo-handlers";
import type { Bindings } from "./api/lib/types";

export const onRequest: PagesFunction<Bindings> = handleSitemap;
