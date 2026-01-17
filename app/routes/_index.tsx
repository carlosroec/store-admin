import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Toya.pe
        </h1>
        <p className="text-xl text-primary-100 mb-8">
          Manage your business with ease
        </p>
        <Link
          to="/login"
          className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
