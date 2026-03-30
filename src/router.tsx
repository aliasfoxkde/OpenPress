import {
  createRouter,
  createRootRoute,
  createRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
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

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminDashboard,
});

const adminContentRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/content",
  lazyRouteComponent: () => import("./routes/admin/AdminContent").then((m) => m.AdminContent),
});

const adminMediaRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/media",
  lazyRouteComponent: () => import("./routes/admin/AdminMedia").then((m) => m.AdminMedia),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/settings",
  lazyRouteComponent: () => import("./routes/admin/AdminSettings").then((m) => m.AdminSettings),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/users",
  lazyRouteComponent: () => import("./routes/admin/AdminUsers").then((m) => m.AdminUsers),
});

const adminAIRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/ai",
  lazyRouteComponent: () => import("./routes/admin/AdminAI").then((m) => m.default),
});

const adminContentEditRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/content/edit",
  lazyRouteComponent: () => import("./routes/admin/ContentEditor").then((m) => m.ContentEditor),
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/products",
  lazyRouteComponent: () => import("./routes/admin/AdminProducts").then((m) => m.default),
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/orders",
  lazyRouteComponent: () => import("./routes/admin/AdminOrders").then((m) => m.default),
});

const adminOrderDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/orders/$id",
  lazyRouteComponent: () => import("./routes/admin/OrderDetail").then((m) => m.OrderDetail),
});

const adminCommentsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/comments",
  lazyRouteComponent: () => import("./routes/admin/AdminComments").then((m) => m.AdminComments),
});

const adminTaxonomiesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/taxonomies",
  lazyRouteComponent: () => import("./routes/admin/AdminTaxonomies").then((m) => m.AdminTaxonomies),
});

const adminProfileRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/profile",
  lazyRouteComponent: () => import("./routes/admin/UserProfile").then((m) => m.UserProfile),
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
  adminRoute.addChildren([
    adminDashboardRoute,
    adminContentRoute,
    adminContentEditRoute,
    adminMediaRoute,
    adminSettingsRoute,
    adminUsersRoute,
    adminAIRoute,
    adminProductsRoute,
    adminOrdersRoute,
    adminOrderDetailRoute,
    adminCommentsRoute,
    adminTaxonomiesRoute,
    adminProfileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
