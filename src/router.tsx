import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./routes/HomePage";
import { StorefrontPage } from "./routes/Storefront";
import { ProductDetailPage } from "./routes/ProductDetail";
import { BlogPage } from "./routes/Blog";
import { BlogPostPage } from "./routes/BlogPost";
import { AdminPage } from "./routes/admin/AdminPage";
import { AdminDashboard } from "./routes/admin/AdminDashboard";
import { AdminContent } from "./routes/admin/AdminContent";
import { ContentEditor } from "./routes/admin/ContentEditor";
import { AdminMedia } from "./routes/admin/AdminMedia";
import { AdminSettings } from "./routes/admin/AdminSettings";
import { AdminUsers } from "./routes/admin/AdminUsers";
import AdminAI from "./routes/admin/AdminAI";
import AdminProducts from "./routes/admin/AdminProducts";
import AdminOrders from "./routes/admin/AdminOrders";
import { LoginPage } from "./routes/LoginPage";
import { CheckoutPage } from "./routes/CheckoutPage";
import { OrderSuccessPage } from "./routes/OrderSuccessPage";
import { OrderCancelPage } from "./routes/OrderCancelPage";
import { AdminComments } from "./routes/admin/AdminComments";
import { UserProfile } from "./routes/admin/UserProfile";
import { NotFoundPage } from "./routes/NotFoundPage";

const rootRoute = createRootRoute({
  component: RootLayout,
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
  component: AdminContent,
});

const adminMediaRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/media",
  component: AdminMedia,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/settings",
  component: AdminSettings,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/users",
  component: AdminUsers,
});

const adminAIRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/ai",
  component: AdminAI,
});

const adminContentEditRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/content/edit",
  component: ContentEditor,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/products",
  component: AdminProducts,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/orders",
  component: AdminOrders,
});

const adminCommentsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/comments",
  component: AdminComments,
});

const adminProfileRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/profile",
  component: UserProfile,
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
    adminCommentsRoute,
    adminProfileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
