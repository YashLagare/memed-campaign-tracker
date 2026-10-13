import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl w-full text-center space-y-8 p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          Campaign Payout Tracker
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Meme’d Marketplace
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Transparent, milestone-based payouts for creators on Instagram & YouTube. Strict budget protection for brand campaigns.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            href="/login"
            className="flex items-center justify-center px-6 py-3.5 text-base font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center px-6 py-3.5 text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
