import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Animated 404 illustration */}
        <div className="relative inline-block mb-6">
          <div className="text-8xl font-black text-transparent bg-gradient-to-br from-primary-400 to-primary-600 bg-clip-text select-none">
            404
          </div>
          <div className="absolute inset-0 text-8xl font-black text-primary-100/20 blur-sm select-none pointer-events-none">
            404
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Go Home
          </Link>
          <Link
            to="/blog"
            className="text-primary-600 hover:text-primary-700 font-medium px-4 py-2.5 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Browse Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
