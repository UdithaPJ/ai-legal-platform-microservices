import Link from "next/link";
import { Scale, Shield, FileSearch, Video, MessageSquare, Star } from "lucide-react";
import { login, register, registerAsClient, registerAsLawyer } from "@/actions/auth-actions";

const features = [
  { icon: Shield, title: "Verified Lawyers", desc: "Bar-registered professionals across all specialisations" },
  { icon: FileSearch, title: "AI Document Analysis", desc: "Instant contract review — risk clauses, plain-English summaries" },
  { icon: Video, title: "Video Consultations", desc: "Secure video sessions with your lawyer, straight from the browser" },
  { icon: MessageSquare, title: "Real-time Messaging", desc: "Chat with your lawyer before, during, and after appointments" },
  { icon: Star, title: "Verified Reviews", desc: "Transparent ratings from real clients after each appointment" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-2">
          <Scale className="size-6 text-blue-600" />
          <span className="text-lg font-semibold">LegalAI</span>
        </div>
        <div className="flex items-center gap-3">
          <form action={login}>
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </button>
          </form>
          <form action={register}>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </button>
          </form>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-8 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          AI-Powered Legal Services
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900">
          Legal help, <span className="text-blue-600">simplified</span>
        </h1>
        <p className="mb-10 text-xl text-gray-500">
          Connect with verified lawyers, get AI-powered document analysis, and
          manage your legal matters — all in one secure platform.
        </p>
        <div className="flex justify-center gap-4">
          <form action={registerAsClient}>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
            >
              Find a Lawyer
            </button>
          </form>
          <form action={registerAsLawyer}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              I&apos;m a Lawyer
            </button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            Everything you need, in one place
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-white p-6">
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-2.5">
                  <Icon className="size-5 text-blue-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-8 text-center text-sm text-gray-400">
        © 2026 LegalAI Platform. All rights reserved.
      </footer>
    </div>
  );
}
