import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
        <ShieldX className="size-8 text-red-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
        <p className="max-w-sm text-sm text-gray-500">
          You do not have permission to view this page. Please sign in with an
          account that has the required role.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go to my dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
