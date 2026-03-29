import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./routes/HomePage";
import { AdminPage } from "./routes/admin/AdminPage";
import { AdminDashboard } from "./routes/admin/AdminDashboard";
import { AdminContent } from "./routes/admin/AdminContent";
import { AdminMedia } from "./routes/admin/AdminMedia";
import { AdminSettings } from "./routes/admin/AdminSettings";
import { AdminUsers } from "./routes/admin/AdminUsers";
import AdminAI from "./routes/admin/AdminAI";
import { LoginPage } from "./routes/LoginPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
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

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminContentRoute,
    adminMediaRoute,
    adminSettingsRoute,
    adminUsersRoute,
    adminAIRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
