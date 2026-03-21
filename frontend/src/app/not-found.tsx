import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-4">Page Not Found</h1>
        <p className="text-zinc-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/arena"
            className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl font-medium hover:bg-white/[0.08] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Arena
          </Link>
        </div>
      </div>
    </div>
  );
}
