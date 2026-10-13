import { Submission, ISubmission } from '../models/Submission';
import { Campaign } from '../models/Campaign';
import { CreateSubmissionInput } from '../validators/submission.validator';
import { paiseToRupees } from '../utils/currency';

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
