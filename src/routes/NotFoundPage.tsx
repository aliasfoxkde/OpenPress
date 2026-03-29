import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-text-tertiary mb-2">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
          >
            Go Home
          </Link>
          <Link
            to="/blog"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
