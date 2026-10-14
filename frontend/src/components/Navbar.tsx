'use client';

import { useAuth } from '@/lib/auth-context';
import { LogOut, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-sm group-hover:bg-indigo-600 transition">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-lg group-hover:text-indigo-600 transition">
                Meme’d
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider -mt-1">
                Payout Tracker
              </span>
            </div>
          </Link>

          {/* {user && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={user.role === 'brand' ? '/brand' : '/creator'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                Dashboard
              </Link>
            </div>
          )} */}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                <span className="text-xs text-slate-400 font-medium capitalize">
                  {user.role} Account
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.role === 'brand'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
              >
                <UserCheck className="w-3 h-3" />
                {user.role === 'brand' ? 'Brand' : 'Creator'}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
