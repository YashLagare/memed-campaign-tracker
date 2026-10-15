'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { apiClient } from '@/lib/api';
import {
  Wallet,
  Eye,
  FileCheck2,
  ExternalLink,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Instagram,
  Youtube,
  Zap,
  PlayCircle,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';

interface CampaignData {
  id: string;
  name: string;
  platform: 'Instagram' | 'YouTube';
  brandName?: string;
  totalBudget: number;
  budgetSpent: number;
  remainingBudget: number;
  milestones: Array<{ views: number; payout: number }>;
}

interface SubmissionData {
  id: string;
  campaignId: string;
  campaignName?: string;
  postUrl: string;
  platform: 'Instagram' | 'YouTube';
  views: number;
  creditedPayout: number;
  lastMilestoneViews: number;
  payoutStatus: string;
  createdAt: string;
}

interface EarningsData {
  totalSubmissions: number;
  totalViews: number;
  totalEarningsRupees: number;
}

interface SimulationFeedback {
  submissionId: string;
  message: string;
  status: string;
  additionalPayoutCreditedRupees: number;
  totalCreditedPayoutRupees: number;
  campaignRemainingBudgetRupees: number;
  highestMilestoneViews: number;
}

export default function CreatorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'submissions'>('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalSubmissions: 0,
    totalViews: 0,
    totalEarningsRupees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Submit Post Modal State
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [postUrl, setPostUrl] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // View Simulator State
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [customViews, setCustomViews] = useState<Record<string, number>>({});
  const [simulationFeedback, setSimulationFeedback] = useState<Record<string, SimulationFeedback>>({});

  const fetchData = async () => {
    try {
      setError(null);
      const [cRes, sRes, eRes] = await Promise.all([
        apiClient<{ campaigns: CampaignData[] }>('/campaigns'),
        apiClient<{ submissions: SubmissionData[] }>('/submissions/mine'),
        apiClient<{ earnings: EarningsData }>('/creators/earnings'),
      ]);

      setCampaigns(cRes.campaigns);
      setSubmissions(sRes.submissions);
      setEarnings(eRes.earnings);

      // Prepopulate view counters for simulation inputs
      const initialViews: Record<string, number> = {};
      sRes.submissions.forEach((s) => {
        initialViews[s.id] = s.views + 10000;
      });
      setCustomViews(initialViews);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to fetch creator dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    setSubmitError(null);
    setSubmittingPost(true);

    try {
      await apiClient('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          postUrl,
        }),
      });

      setPostUrl('');
      setSelectedCampaign(null);
      setActiveTab('submissions');

      startTransition(() => {
        fetchData();
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSubmitError(e.message || 'Failed to submit post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSimulateViews = async (submissionId: string, viewsToSet: number) => {
    setSimulatingId(submissionId);
    try {
      const res = await apiClient<SimulationFeedback>(`/submissions/${submissionId}/views`, {
        method: 'PATCH',
        body: JSON.stringify({ views: viewsToSet }),
      });

      setSimulationFeedback((prev) => ({
        ...prev,
        [submissionId]: res,
      }));

      startTransition(() => {
        fetchData();
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || 'Failed to update views');
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <AuthGuard allowedRole="creator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Creator Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse brand campaigns, submit content links, and monitor milestone earnings
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Creator Earnings Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{earnings.totalEarningsRupees.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">Credited across all milestones</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Submissions</span>
              <FileCheck2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{earnings.totalSubmissions}</div>
            <div className="text-xs text-slate-500">Content posts submitted</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Accumulated Views</span>
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{earnings.totalViews.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total verified social views</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
              activeTab === 'campaigns'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Browse Live Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
              activeTab === 'submissions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Submissions & View Simulator ({submissions.length})
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: BROWSE CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {loading ? (
              <div className="min-h-[250px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="min-h-[250px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                <h3 className="text-base font-bold text-slate-800">No active campaigns right now</h3>
                <p className="text-sm text-slate-500">
                  Check back soon! Brands post new campaigns frequently.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            camp.platform === 'Instagram'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {camp.platform === 'Instagram' ? (
                            <Instagram className="w-3 h-3" />
                          ) : (
                            <Youtube className="w-3 h-3" />
                          )}
                          {camp.platform}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ₹{camp.remainingBudget.toLocaleString()} Budget Left
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{camp.name}</h3>
                        {camp.brandName && (
                          <span className="text-xs text-slate-400 font-medium">
                            by {camp.brandName}
                          </span>
                        )}
                      </div>

                      {/* Milestone Ladder Preview */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Payout Milestones
                        </span>
                        <div className="space-y-1">
                          {camp.milestones.map((m, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 rounded-lg border border-slate-100"
                            >
                              <span className="text-slate-600 font-medium">
                                {m.views.toLocaleString()} views
                              </span>
                              <span className="font-bold text-indigo-600">
                                ₹{m.payout.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCampaign(camp)}
                      className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Submit Post Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY SUBMISSIONS & VIEW SIMULATOR */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {loading ? (
              <div className="min-h-[250px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="min-h-[250px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <h3 className="text-base font-bold text-slate-800">You haven’t submitted any posts yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Browse the live campaigns tab, select a campaign, and submit your Instagram or YouTube link.
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Browse Campaigns
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((sub) => {
                  const feedback = simulationFeedback[sub.id];
                  const currentSimView = customViews[sub.id] || sub.views + 10000;

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
                    >
                      {/* Post Information Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                sub.platform === 'Instagram'
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {sub.platform === 'Instagram' ? (
                                <Instagram className="w-3 h-3" />
                              ) : (
                                <Youtube className="w-3 h-3" />
                              )}
                              {sub.platform}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {sub.campaignName || 'Campaign'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                sub.payoutStatus === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.payoutStatus === 'INSUFFICIENT_BUDGET'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sub.payoutStatus}
                            </span>
                          </div>
                          <a
                            href={sub.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono break-all pt-1"
                          >
                            {sub.postUrl}
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        {/* Current Stats */}
                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Verified Views
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {sub.views.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Credited Payout
                            </span>
                            <span className="text-base font-black text-emerald-600">
                              ₹{sub.creditedPayout.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Feedback Alert */}
                      {feedback && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                            feedback.status === 'CREDITED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : feedback.status === 'INSUFFICIENT_BUDGET'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block">{feedback.message}</span>
                            <div className="flex gap-4 pt-1 font-medium text-[11px]">
                              <span>Additional Credited: ₹{feedback.additionalPayoutCreditedRupees}</span>
                              <span>Total Payout: ₹{feedback.totalCreditedPayoutRupees}</span>
                              <span>Campaign Budget Left: ₹{feedback.campaignRemainingBudgetRupees}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Simulation Controller */}
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Simulate Platform View Increment (PATCH /api/submissions/:id/views)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Current Views: {sub.views.toLocaleString()}
                          </span>
                        </div>

                        {/* Quick Jump Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Quick Step:</span>
                          {[10000, 50000, 100000].map((inc) => (
                            <button
                              key={inc}
                              disabled={simulatingId === sub.id}
                              onClick={() => handleSimulateViews(sub.id, sub.views + inc)}
                              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition shadow-xs disabled:opacity-50"
                            >
                              +{inc.toLocaleString()} views
                            </button>
                          ))}
                        </div>

                        {/* Custom Input */}
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="number"
                            min={sub.views}
                            value={currentSimView}
                            onChange={(e) =>
                              setCustomViews({
                                ...customViews,
                                [sub.id]: Number(e.target.value),
                              })
                            }
                            placeholder="Enter new view count"
                            className="flex-1 max-w-xs px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            disabled={simulatingId === sub.id}
                            onClick={() => handleSimulateViews(sub.id, currentSimView)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 shadow-xs"
                          >
                            {simulatingId === sub.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5" />
                            )}
                            Apply View Update
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Submit Post Link */}
        {selectedCampaign && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 my-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Submit Content Link</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For campaign: <span className="font-semibold text-slate-700">{selectedCampaign.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                <span className="font-bold block text-slate-800">
                  Required Platform: {selectedCampaign.platform}
                </span>
                <span>
                  Make sure your URL belongs to {selectedCampaign.platform} (e.g.{' '}
                  {selectedCampaign.platform === 'Instagram'
                    ? 'https://instagram.com/p/...'
                    : 'https://youtube.com/watch?v=...'}
                  )
                </span>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Post Link
                  </label>
                  <input
                    type="url"
                    required
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder={
                      selectedCampaign.platform === 'Instagram'
                        ? 'https://www.instagram.com/p/C3...'
                        : 'https://www.youtube.com/watch?v=...'
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCampaign(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {submittingPost ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Confirm Submission'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
