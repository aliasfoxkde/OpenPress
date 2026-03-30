import {
  createRouter,
  createRootRoute,
  createRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
// TanStack Router v1.120+ lazyRouteComponent support
// Type definitions may lag behind installed version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createLazyRoute = createRoute as any;
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./routes/HomePage";
import { StorefrontPage } from "./routes/Storefront";
import { ProductDetailPage } from "./routes/ProductDetail";
import { BlogPage } from "./routes/Blog";
import { BlogPostPage } from "./routes/BlogPost";
import { AdminPage } from "./routes/admin/AdminPage";
import { AdminDashboard } from "./routes/admin/AdminDashboard";
import { LoginPage } from "./routes/LoginPage";
import { CheckoutPage } from "./routes/CheckoutPage";
import { OrderSuccessPage } from "./routes/OrderSuccessPage";
import { OrderCancelPage } from "./routes/OrderCancelPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { ApiDocs } from "./routes/ApiDocs";
import { Tutorial } from "./routes/Tutorial";
import { Templates } from "./routes/Templates";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop",
  component: StorefrontPage,
});

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop/$slug",
  component: ProductDetailPage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

const blogPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: BlogPostPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const orderSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order/success",
  component: OrderSuccessPage,
});

const orderCancelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order/cancel",
  component: OrderCancelPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: NotFoundPage,
});

const apiDocsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/api",
  component: ApiDocs,
});

const tutorialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/tutorial",
  component: Tutorial,
});

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/templates",
  component: Templates,
});

const adminRoute = createLazyRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const adminDashboardRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminDashboard,
});

const adminContentRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/content",
  lazyRouteComponent: () => import("./routes/admin/AdminContent").then((m) => m.AdminContent),
});

const adminMediaRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/media",
  lazyRouteComponent: () => import("./routes/admin/AdminMedia").then((m) => m.AdminMedia),
});

const adminSettingsRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/settings",
  lazyRouteComponent: () => import("./routes/admin/AdminSettings").then((m) => m.AdminSettings),
});

const adminUsersRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/users",
  lazyRouteComponent: () => import("./routes/admin/AdminUsers").then((m) => m.AdminUsers),
});

const adminAIRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/ai",
  lazyRouteComponent: () => import("./routes/admin/AdminAI").then((m) => m.default),
});

const adminContentEditRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/content/edit",
  lazyRouteComponent: () => import("./routes/admin/ContentEditor").then((m) => m.ContentEditor),
});

const adminProductsRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/products",
  lazyRouteComponent: () => import("./routes/admin/AdminProducts").then((m) => m.default),
});

const adminCompositeRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/composite",
  lazyRouteComponent: () => import("./routes/admin/AdminComposite").then((m) => m.AdminComposite),
});

const adminOrdersRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/orders",
  lazyRouteComponent: () => import("./routes/admin/AdminOrders").then((m) => m.default),
});

const adminOrderDetailRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/orders/$id",
  lazyRouteComponent: () => import("./routes/admin/OrderDetail").then((m) => m.OrderDetail),
});

const adminCommentsRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/comments",
  lazyRouteComponent: () => import("./routes/admin/AdminComments").then((m) => m.AdminComments),
});

const adminTaxonomiesRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/taxonomies",
  lazyRouteComponent: () => import("./routes/admin/AdminTaxonomies").then((m) => m.AdminTaxonomies),
});

const adminProfileRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/profile",
  lazyRouteComponent: () => import("./routes/admin/UserProfile").then((m) => m.UserProfile),
});

const adminThemesRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/themes",
  lazyRouteComponent: () => import("./routes/admin/AdminThemes").then((m) => m.AdminThemes),
});

const adminPaymentsRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/payments",
  lazyRouteComponent: () => import("./routes/admin/AdminPayments").then((m) => m.AdminPayments),
});

const adminMarketingRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/marketing",
  lazyRouteComponent: () => import("./routes/admin/AdminMarketing").then((m) => m.AdminMarketing),
});

const adminSocialRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/social",
  lazyRouteComponent: () => import("./routes/admin/AdminSocial").then((m) => m.AdminSocial),
});

const adminComponentsRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/components",
  lazyRouteComponent: () => import("./routes/admin/AdminComponents").then((m) => m.AdminComponents),
});

const adminNavigationRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/navigation",
  lazyRouteComponent: () => import("./routes/admin/AdminNavigation").then((m) => m.AdminNavigation),
});

const adminHeroSlidesRoute = createLazyRoute({
  getParentRoute: () => adminRoute,
  path: "/hero-slides",
  lazyRouteComponent: () => import("./routes/admin/AdminHeroSlides").then((m) => m.AdminHeroSlides),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  shopRoute,
  productRoute,
  blogRoute,
  blogPostRoute,
  loginRoute,
  checkoutRoute,
  orderSuccessRoute,
  orderCancelRoute,
  notFoundRoute,
  apiDocsRoute,
  tutorialRoute,
  templatesRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminContentRoute,
    adminContentEditRoute,
    adminMediaRoute,
    adminSettingsRoute,
    adminUsersRoute,
    adminAIRoute,
    adminProductsRoute,
    adminCompositeRoute,
    adminOrdersRoute,
    adminOrderDetailRoute,
    adminCommentsRoute,
    adminTaxonomiesRoute,
    adminThemesRoute,
    adminProfileRoute,
    adminPaymentsRoute,
    adminMarketingRoute,
    adminSocialRoute,
    adminComponentsRoute,
    adminNavigationRoute,
    adminHeroSlidesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
