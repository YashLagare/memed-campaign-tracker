import { Campaign, ICampaign, IMilestone } from '../models/Campaign';
import { CreateCampaignInput } from '../validators/campaign.validator';
import { rupeesToPaise, paiseToRupees } from '../utils/currency';

export interface FormattedCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  brandId: string;
  brandName?: string;
  totalBudget: number; // in rupees
  budgetSpent: number; // in rupees
  remainingBudget: number; // in rupees
  milestones: Array<{ views: number; payout: number }>; // in rupees
  createdAt: Date;
  updatedAt: Date;
}

export function formatCampaign(doc: ICampaign & { brandId?: { name?: string; _id?: unknown } | unknown }): FormattedCampaign {
  const brandName = typeof doc.brandId === 'object' && doc.brandId !== null && 'name' in doc.brandId
    ? (doc.brandId as { name: string }).name
    : undefined;

  const brandId = typeof doc.brandId === 'object' && doc.brandId !== null && '_id' in doc.brandId
    ? String((doc.brandId as { _id: unknown })._id)
    : String(doc.brandId);

  return {
    id: doc._id.toString(),
    name: doc.name,
    platform: doc.platform,
    status: doc.status,
    brandId,
    brandName,
    totalBudget: paiseToRupees(doc.totalBudget),
    budgetSpent: paiseToRupees(doc.budgetSpent),
    remainingBudget: paiseToRupees(Math.max(0, doc.totalBudget - doc.budgetSpent)),
    milestones: doc.milestones.map((m: IMilestone) => ({
      views: m.views,
      payout: paiseToRupees(m.payout),
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createCampaign(brandId: string, input: CreateCampaignInput): Promise<FormattedCampaign> {
  // Sort milestones ascending by views
  const sortedMilestones = [...input.milestones].sort((a, b) => a.views - b.views);

  // Convert rupees to paise for internal precision
  const totalBudgetPaise = rupeesToPaise(input.totalBudget);
  const milestonesPaise: IMilestone[] = sortedMilestones.map((m) => ({
    views: m.views,
    payout: rupeesToPaise(m.payout),
  }));

  const campaign = await Campaign.create({
    brandId,
    name: input.name,
    platform: input.platform,
    totalBudget: totalBudgetPaise,
    budgetSpent: 0,
    milestones: milestonesPaise,
    status: 'ACTIVE',
  });

  return formatCampaign(campaign);
}

export async function getActiveCampaigns(): Promise<FormattedCampaign[]> {
  const campaigns = await Campaign.find({ status: 'ACTIVE' })
    .populate('brandId', 'name')
    .sort({ createdAt: -1 });

  return campaigns.map(formatCampaign);
}

export async function getBrandCampaigns(brandId: string): Promise<FormattedCampaign[]> {
  const campaigns = await Campaign.find({ brandId })
    .populate('brandId', 'name')
    .sort({ createdAt: -1 });

  return campaigns.map(formatCampaign);
}

export async function getCampaignById(campaignId: string): Promise<FormattedCampaign | null> {
  const campaign = await Campaign.findById(campaignId).populate('brandId', 'name');
  if (!campaign) return null;
  return formatCampaign(campaign);
}
