import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { PublicRoute } from "./components/routing/PublicRoute";
import { AppError } from "./components/shared/AppError";
import { PageSkeleton } from "./components/shared/LoadingSkeleton";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardLayout = lazy(() => import("./components/Layout/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const Documents = lazy(() => import("./pages/Documents"));
const DocumentDetails = lazy(() => import("./pages/DocumentDetails"));
const Search = lazy(() => import("./pages/Search"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Review = lazy(() => import("./pages/Review"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const withSuspense = (Component: ComponentType) =>
  function SuspendedRoute() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
    );
  };

export const router = createBrowserRouter([
  {
    path: "/",
    Component: withSuspense(Landing),
    errorElement: <AppError />,
  },
  {
    Component: PublicRoute,
    errorElement: <AppError />,
    children: [
      {
        path: "/login",
        Component: withSuspense(Login),
      },
      {
        path: "/register",
        Component: withSuspense(Register),
      },
    ],
  },
  {
    Component: ProtectedRoute,
    errorElement: <AppError />,
    children: [
      {
        path: "/app",
        Component: withSuspense(DashboardLayout),
        children: [
          { index: true, Component: withSuspense(Dashboard) },
          { path: "upload", Component: withSuspense(Upload) },
          { path: "documents", Component: withSuspense(Documents) },
          { path: "documents/:id", Component: withSuspense(DocumentDetails) },
          { path: "search", Component: withSuspense(Search) },
          { path: "ai-chat", Component: withSuspense(AIChat) },
          { path: "analytics", Component: withSuspense(Analytics) },
          { path: "review", Component: withSuspense(Review) },
          { path: "settings", Component: withSuspense(Settings) },
          { path: "profile", Component: withSuspense(Profile) },
        ],
      },
    ],
  },
  {
    path: "*",
    Component: withSuspense(NotFound),
  },
]);
