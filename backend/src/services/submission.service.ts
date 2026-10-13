import mongoose from 'mongoose';
import { Submission, ISubmission } from '../models/Submission';
import { Campaign } from '../models/Campaign';
import { CreateSubmissionInput } from '../validators/submission.validator';
import { paiseToRupees } from '../utils/currency';
import { calculateIncrementalPayout, IncrementalPayoutResult } from './payout.engine';

export interface FormattedSubmission {
  id: string;
  campaignId: string;
  campaignName?: string;
  creatorId: string;
  postUrl: string;
  platform: string;
  views: number;
  creditedPayout: number; // in rupees
  lastMilestoneViews: number;
  payoutStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export function formatSubmission(doc: ISubmission & { campaignId?: { name?: string; _id?: unknown } | unknown }): FormattedSubmission {
  const campaignName = typeof doc.campaignId === 'object' && doc.campaignId !== null && 'name' in doc.campaignId
    ? (doc.campaignId as { name: string }).name
    : undefined;

  const campaignId = typeof doc.campaignId === 'object' && doc.campaignId !== null && '_id' in doc.campaignId
    ? String((doc.campaignId as { _id: unknown })._id)
    : String(doc.campaignId);

  return {
    id: doc._id.toString(),
    campaignId,
    campaignName,
    creatorId: doc.creatorId.toString(),
    postUrl: doc.postUrl,
    platform: doc.platform,
    views: doc.views,
    creditedPayout: paiseToRupees(doc.creditedPayout),
    lastMilestoneViews: doc.lastMilestoneViews,
    payoutStatus: doc.payoutStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createSubmission(
  creatorId: string,
  input: CreateSubmissionInput
): Promise<{ success: boolean; submission?: FormattedSubmission; error?: string; status: number }> {
  const campaign = await Campaign.findById(input.campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign does not exist', status: 404 };
  }

  if (campaign.status !== 'ACTIVE') {
    return { success: false, error: 'Campaign is not currently active', status: 400 };
  }

  // Validate platform matching
  const lowerUrl = input.postUrl.toLowerCase();
  if (campaign.platform === 'Instagram' && !lowerUrl.includes('instagram.com')) {
    return {
      success: false,
      error: 'Post URL must be an Instagram link for an Instagram campaign',
      status: 400,
    };
  }

  if (
    campaign.platform === 'YouTube' &&
    !lowerUrl.includes('youtube.com') &&
    !lowerUrl.includes('youtu.be')
  ) {
    return {
      success: false,
      error: 'Post URL must be a YouTube link for a YouTube campaign',
      status: 400,
    };
  }

  // Check for duplicate submission
  const existingSubmission = await Submission.findOne({
    campaignId: campaign._id,
    postUrl: input.postUrl,
  });

  if (existingSubmission) {
    return {
      success: false,
      error: 'This post URL has already been submitted to this campaign',
      status: 409,
    };
  }

  const submission = await Submission.create({
    campaignId: campaign._id,
    creatorId,
    postUrl: input.postUrl,
    platform: campaign.platform,
    views: 0,
    creditedPayout: 0,
    lastMilestoneViews: 0,
    payoutStatus: 'NONE',
  });

  return {
    success: true,
    submission: formatSubmission(submission),
    status: 201,
  };
}

export async function getCreatorSubmissions(creatorId: string): Promise<FormattedSubmission[]> {
  const submissions = await Submission.find({ creatorId })
    .populate('campaignId', 'name platform')
    .sort({ createdAt: -1 });

  return submissions.map(formatSubmission);
}

export async function getCreatorEarnings(creatorId: string): Promise<{
  totalSubmissions: number;
  totalViews: number;
  totalEarningsRupees: number;
}> {
  const submissions = await Submission.find({ creatorId });

  let totalViews = 0;
  let totalEarningsPaise = 0;

  for (const sub of submissions) {
    totalViews += sub.views;
    totalEarningsPaise += sub.creditedPayout;
  }

  return {
    totalSubmissions: submissions.length,
    totalViews,
    totalEarningsRupees: paiseToRupees(totalEarningsPaise),
  };
}

export interface ViewUpdateResponse {
  message: string;
  submissionId: string;
  views: number;
  previousViews: number;
  earnedMilestonePayoutRupees: number;
  additionalPayoutCreditedRupees: number;
  totalCreditedPayoutRupees: number;
  campaignBudgetSpentRupees: number;
  campaignRemainingBudgetRupees: number;
  status: string;
  highestMilestoneViews: number;
}

export async function updateViews(
  submissionId: string,
  newViews: number
): Promise<{ success: boolean; data?: ViewUpdateResponse; error?: string; status: number }> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return { success: false, error: 'Invalid submission ID format', status: 400 };
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    return { success: false, error: 'Submission not found', status: 404 };
  }

  if (newViews < submission.views) {
    return {
      success: false,
      error: `New view count (${newViews}) cannot be less than existing view count (${submission.views})`,
      status: 400,
    };
  }

  const campaign = await Campaign.findById(submission.campaignId);
  if (!campaign) {
    return { success: false, error: 'Associated campaign not found', status: 404 };
  }

  const previousViews = submission.views;

  const result: IncrementalPayoutResult = calculateIncrementalPayout({
    newViews,
    currentViews: submission.views,
    milestones: campaign.milestones,
    previouslyCreditedPayout: submission.creditedPayout,
    totalBudget: campaign.totalBudget,
    currentBudgetSpent: campaign.budgetSpent,
  });

  if (result.status === 'CREDITED') {
    campaign.budgetSpent = result.newBudgetSpent;
    await campaign.save();

    submission.views = newViews;
    submission.creditedPayout = result.newCreditedPayout;
    submission.lastMilestoneViews = result.highestMilestoneViews;

    const maxMilestoneViews = Math.max(...campaign.milestones.map((m) => m.views));
    submission.payoutStatus = result.highestMilestoneViews >= maxMilestoneViews ? 'COMPLETED' : 'PARTIAL';
    await submission.save();
  } else if (result.status === 'INSUFFICIENT_BUDGET') {
    submission.views = newViews;
    submission.payoutStatus = 'INSUFFICIENT_BUDGET';
    await submission.save();
  } else {
    // NO_NEW_MILESTONE or ZERO_BELOW_FIRST_MILESTONE
    submission.views = newViews;
    await submission.save();
  }

  const updatedCampaignRemaining = Math.max(0, campaign.totalBudget - campaign.budgetSpent);

  return {
    success: true,
    status: 200,
    data: {
      message: result.message,
      submissionId: submission._id.toString(),
      views: newViews,
      previousViews,
      earnedMilestonePayoutRupees: paiseToRupees(result.earnedMilestonePayout),
      additionalPayoutCreditedRupees: paiseToRupees(result.additionalPayout),
      totalCreditedPayoutRupees: paiseToRupees(submission.creditedPayout),
      campaignBudgetSpentRupees: paiseToRupees(campaign.budgetSpent),
      campaignRemainingBudgetRupees: paiseToRupees(updatedCampaignRemaining),
      status: result.status,
      highestMilestoneViews: result.highestMilestoneViews,
    },
  };
}
