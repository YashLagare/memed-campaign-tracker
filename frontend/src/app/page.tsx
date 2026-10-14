'use client';

import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Flame,
  Instagram,
  Sparkles,
  Youtube,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-12">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Creator Marketplace Payout Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Fair Milestone Payouts.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Zero Overspending.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Meme’d connects brands with meme pages and clip creators on Instagram & YouTube. Brands set milestone ladders with protected budget caps; creators earn automated incremental payouts as views climb.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          {user ? (
            <Link
              href={user.role === 'brand' ? '/brand' : '/creator'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition shadow-md"
            >
              Go to Your Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition shadow-md"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition shadow-xs"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Interactive Example Milestone Visualizer Card */}
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Core Engine Architecture
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                How Milestone Payouts Work
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-semibold border border-pink-200">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-200">
                <Youtube className="w-3.5 h-3.5" /> YouTube
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Tier 1</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-700">10K Views</span>
              </div>
              <div className="text-2xl font-black text-slate-900">₹500</div>
              <p className="text-xs text-slate-500">
                First milestone unlocked when post hits 10,000 views.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-500 uppercase">Tier 2</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-200/60 rounded text-indigo-800">50K Views</span>
              </div>
              <div className="text-2xl font-black text-indigo-600">₹2,000</div>
              <p className="text-xs text-slate-500">
                Pays incremental ₹1,500 (₹2,000 minus ₹500 already credited).
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 uppercase">Tier 3</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-200/60 rounded text-emerald-800">100K Views</span>
              </div>
              <div className="text-2xl font-black text-emerald-600">₹5,000</div>
              <p className="text-xs text-slate-500">
                Pays incremental ₹3,000 (highest milestone reached).
              </p>
            </div>
          </div>

          {/* Business rules banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-slate-600 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Highest milestone credited (no double-summing)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Strict budget cap (spend ≤ total budget)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All-or-nothing payout on insufficient budget</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl pt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">For Brands</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define custom campaigns with flexible milestone ladders. Real-time budget spent vs. remaining monitors guarantee zero budget overruns.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">For Creators</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browse live brand campaigns, submit content post links, and watch payouts increment automatically as views cross milestone thresholds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">View Simulation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Built-in live interactive view simulator powered by <code>PATCH /api/submissions/:id/views</code> enables instant verification of calculations.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © 2026 <span className="font-bold text-slate-700">Meme’d Campaign Payout Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://portfolio-five-opal-53.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-indigo-600 font-medium transition inline-flex items-center gap-1 hover:underline"
            >
              Developed by <span className="font-semibold text-slate-800">Yash</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
