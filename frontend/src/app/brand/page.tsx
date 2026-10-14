'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { apiClient } from '@/lib/api';
import {
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sliders,
  Layers,
  Sparkles,
  Instagram,
  Youtube,
} from 'lucide-react';

interface MilestoneInput {
  views: number;
  payout: number;
}

interface CampaignData {
  id: string;
  name: string;
  platform: 'Instagram' | 'YouTube';
  status: string;
  totalBudget: number;
  budgetSpent: number;
  remainingBudget: number;
  milestones: Array<{ views: number; payout: number }>;
  createdAt: string;
}

export default function BrandDashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Campaign Form State
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'Instagram' | 'YouTube'>('Instagram');
  const [totalBudget, setTotalBudget] = useState<number>(10000);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { views: 10000, payout: 500 },
    { views: 50000, payout: 2000 },
    { views: 100000, payout: 5000 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setError(null);
      const res = await apiClient<{ campaigns: CampaignData[] }>('/campaigns/mine');
      setCampaigns(res.campaigns);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load brand campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const addMilestoneRow = () => {
    const last = milestones[milestones.length - 1];
    const nextViews = last ? last.views * 2 : 10000;
    const nextPayout = last ? last.payout * 2 : 500;
    setMilestones([...milestones, { views: nextViews, payout: nextPayout }]);
  };

  const removeMilestoneRow = (index: number) => {
    if (milestones.length <= 1) {
      setFormError('A campaign must have at least one milestone');
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: 'views' | 'payout', value: number) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate ladder ordering
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].views <= 0 || milestones[i].payout <= 0) {
        setFormError('All milestone views and payouts must be positive numbers');
        return;
      }
      if (i > 0) {
        if (milestones[i].views <= milestones[i - 1].views) {
          setFormError(`Milestone tier ${i + 1} views must be strictly greater than tier ${i} views`);
          return;
        }
        if (milestones[i].payout <= milestones[i - 1].payout) {
          setFormError(`Milestone tier ${i + 1} payout must be strictly greater than tier ${i} payout`);
          return;
        }
      }
      if (milestones[i].payout > totalBudget) {
        setFormError(`Milestone payout (₹${milestones[i].payout}) cannot exceed total campaign budget (₹${totalBudget})`);
        return;
      }
    }

    setSubmitting(true);

    try {
      await apiClient('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name,
          platform,
          totalBudget: Number(totalBudget),
          milestones: milestones.map((m) => ({
            views: Number(m.views),
            payout: Number(m.payout),
          })),
        }),
      });

      // Reset form
      setName('');
      setPlatform('Instagram');
      setTotalBudget(10000);
      setMilestones([
        { views: 10000, payout: 500 },
        { views: 50000, payout: 2000 },
        { views: 100000, payout: 5000 },
      ]);
      setShowCreateModal(false);

      startTransition(() => {
        fetchCampaigns();
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics summary
  const totalAllocated = campaigns.reduce((acc, c) => acc + c.totalBudget, 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + c.budgetSpent, 0);
  const totalRemaining = campaigns.reduce((acc, c) => acc + c.remainingBudget, 0);

  return (
    <AuthGuard allowedRole="brand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Brand Campaign Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create campaigns, configure milestone ladders, and monitor live budget burn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCampaigns()}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isPending ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Launch New Campaign
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{campaigns.length}</div>
            <div className="text-xs text-slate-500">Managed campaigns</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Allocated</span>
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{totalAllocated.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total authorized budget</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Budget Spent</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">₹{totalSpent.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Credited to creator payouts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Remaining Budget</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">₹{totalRemaining.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Available for future milestones</div>
          </div>
        </div>

        {/* Campaign List Table / Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Campaigns</h2>
            <span className="text-xs font-medium text-slate-500">
              {campaigns.length} total campaigns
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="min-h-[250px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No campaigns created yet</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Launch your first campaign with a custom milestone ladder to start receiving creator submissions.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((camp) => {
                const spentPercentage = Math.min(
                  100,
                  Math.round((camp.budgetSpent / (camp.totalBudget || 1)) * 100)
                );

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 hover:border-slate-300 transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {camp.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5">{camp.name}</h3>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(camp.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Budget Burn Meter */}
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Budget Utilization</span>
                        <span className="font-bold text-slate-900">{spentPercentage}% Spent</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-slate-900 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${spentPercentage}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total</span>
                          <span className="font-bold text-slate-800">₹{camp.totalBudget.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Spent</span>
                          <span className="font-bold text-amber-600">₹{camp.budgetSpent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining</span>
                          <span className="font-bold text-emerald-600">₹{camp.remainingBudget.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Ladder */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Milestone Ladder
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {camp.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center flex flex-col justify-center"
                          >
                            <span className="text-xs font-semibold text-slate-700">
                              {m.views.toLocaleString()} views
                            </span>
                            <span className="text-xs font-bold text-indigo-600">
                              ₹{m.payout.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create Campaign */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 sm:p-8 space-y-6 my-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Launch Campaign</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure budget & view-to-payout milestone ladder
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Hype Drops 2026"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as 'Instagram' | 'YouTube')}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Total Budget (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      placeholder="10000"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Dynamic Milestone Ladder Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Milestone Ladder (Views & Payout)
                    </label>
                    <button
                      type="button"
                      onClick={addMilestoneRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Tier
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {milestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Views"
                            value={m.views}
                            onChange={(e) => updateMilestone(idx, 'views', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                        <span className="text-xs text-slate-400">views →</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Payout (₹)"
                            value={m.payout}
                            onChange={(e) => updateMilestone(idx, 'payout', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestoneRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Save Campaign
                      </>
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
