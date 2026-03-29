import { Link } from "@tanstack/react-router";

export function OrderCancelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="text-4xl mb-4">&#10007;</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Order Cancelled</h1>
      <p className="text-text-secondary mb-6">
        Your checkout was cancelled. No charges were made.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/shop"
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
}
