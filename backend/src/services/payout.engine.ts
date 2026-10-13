import { IMilestone } from '../models/Campaign';

export type PayoutEngineStatus =
  | 'ZERO_BELOW_FIRST_MILESTONE'
  | 'CREDITED'
  | 'NO_NEW_MILESTONE'
  | 'INSUFFICIENT_BUDGET';

export interface MilestonePayoutResult {
  earnedPayout: number;
  highestMilestoneViews: number;
  milestoneIndex: number;
}

export interface IncrementalPayoutInput {
  newViews: number;
  currentViews: number;
  milestones: IMilestone[];
  previouslyCreditedPayout: number;
  totalBudget: number;
  currentBudgetSpent: number;
}

export interface IncrementalPayoutResult {
  newViews: number;
  earnedMilestonePayout: number;
  highestMilestoneViews: number;
  previouslyCreditedPayout: number;
  additionalPayout: number;
  newCreditedPayout: number;
  currentBudgetSpent: number;
  newBudgetSpent: number;
  remainingBudget: number;
  status: PayoutEngineStatus;
  message: string;
}

/**
 * Validates milestone ladder configuration
 * Milestones must have:
 * - At least 1 milestone
 * - Strictly increasing view thresholds
 * - Strictly increasing payout values
 * - Positive values
 */
export function validateMilestoneLadder(milestones: IMilestone[]): { valid: boolean; error?: string } {
  if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
    return { valid: false, error: 'Milestone ladder must contain at least one milestone' };
  }

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    if (typeof m.views !== 'number' || isNaN(m.views) || m.views <= 0) {
      return { valid: false, error: `Milestone at index ${i} has invalid views threshold: ${m.views}` };
    }
    if (typeof m.payout !== 'number' || isNaN(m.payout) || m.payout <= 0) {
      return { valid: false, error: `Milestone at index ${i} has invalid payout: ${m.payout}` };
    }

    if (i > 0) {
      const prev = milestones[i - 1];
      if (m.views <= prev.views) {
        return {
          valid: false,
          error: `Milestone at index ${i} views (${m.views}) must be greater than previous (${prev.views})`,
        };
      }
      if (m.payout <= prev.payout) {
        return {
          valid: false,
          error: `Milestone at index ${i} payout (${m.payout}) must be greater than previous (${prev.payout})`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Pure function: calculates the earned milestone payout based on the HIGHEST milestone crossed.
 * Never sums milestone values.
 *
 * Example:
 * 10K -> 500, 50K -> 2000, 100K -> 5000
 * 5K   -> 0
 * 10K  -> 500
 * 30K  -> 500
 * 50K  -> 2000
 * 100K -> 5000
 */
export function calculateMilestonePayout(
  views: number,
  milestones: IMilestone[]
): MilestonePayoutResult {
  if (views < 0) {
    throw new Error('Views count cannot be negative');
  }

  const validation = validateMilestoneLadder(milestones);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sort milestones ascending by views (defensive)
  const sorted = [...milestones].sort((a, b) => a.views - b.views);

  let earnedPayout = 0;
  let highestMilestoneViews = 0;
  let milestoneIndex = -1;

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (views >= sorted[i].views) {
      earnedPayout = sorted[i].payout;
      highestMilestoneViews = sorted[i].views;
      milestoneIndex = i;
      break;
    }
  }

  return {
    earnedPayout,
    highestMilestoneViews,
    milestoneIndex,
  };
}

/**
 * Pure function: calculates incremental payout, enforcing strict campaign budget protection.
 *
 * Business Rules:
 * 1. additionalPayout = Math.max(0, milestonePayout - previouslyCreditedPayout)
 * 2. If additionalPayout === 0, status is NO_NEW_MILESTONE or ZERO_BELOW_FIRST_MILESTONE
 * 3. Budget Protection: budgetSpent <= totalBudget
 * 4. All-or-Nothing Policy: If remainingBudget < additionalPayout, issue 0 additional payout.
 */
export function calculateIncrementalPayout(input: IncrementalPayoutInput): IncrementalPayoutResult {
  const {
    newViews,
    currentViews,
    milestones,
    previouslyCreditedPayout,
    totalBudget,
    currentBudgetSpent,
  } = input;

  if (newViews < 0) {
    throw new Error('New views count cannot be negative');
  }

  if (newViews < currentViews) {
    throw new Error(`New views (${newViews}) cannot be less than existing views (${currentViews})`);
  }

  if (previouslyCreditedPayout < 0) {
    throw new Error('Previously credited payout cannot be negative');
  }

  if (totalBudget < 0) {
    throw new Error('Total budget cannot be negative');
  }

  if (currentBudgetSpent < 0) {
    throw new Error('Current budget spent cannot be negative');
  }

  const milestoneResult = calculateMilestonePayout(newViews, milestones);
  const earnedMilestonePayout = milestoneResult.earnedPayout;
  const remainingBudgetBeforeUpdate = Math.max(0, totalBudget - currentBudgetSpent);

  // If below the first milestone
  if (milestoneResult.milestoneIndex === -1) {
    return {
      newViews,
      earnedMilestonePayout: 0,
      highestMilestoneViews: 0,
      previouslyCreditedPayout,
      additionalPayout: 0,
      newCreditedPayout: previouslyCreditedPayout,
      currentBudgetSpent,
      newBudgetSpent: currentBudgetSpent,
      remainingBudget: remainingBudgetBeforeUpdate,
      status: 'ZERO_BELOW_FIRST_MILESTONE',
      message: 'View count has not reached the first milestone threshold yet',
    };
  }

  // Calculate required incremental payout
  const requiredAdditional = Math.max(0, earnedMilestonePayout - previouslyCreditedPayout);

  // If no additional payout is due (already credited this milestone or higher)
  if (requiredAdditional === 0) {
    return {
      newViews,
      earnedMilestonePayout,
      highestMilestoneViews: milestoneResult.highestMilestoneViews,
      previouslyCreditedPayout,
      additionalPayout: 0,
      newCreditedPayout: previouslyCreditedPayout,
      currentBudgetSpent,
      newBudgetSpent: currentBudgetSpent,
      remainingBudget: remainingBudgetBeforeUpdate,
      status: 'NO_NEW_MILESTONE',
      message: 'Views updated, but no new milestone crossed. Additional payout is 0.',
    };
  }

  // Check campaign budget constraint: all-or-nothing policy
  if (requiredAdditional > remainingBudgetBeforeUpdate) {
    return {
      newViews,
      earnedMilestonePayout,
      highestMilestoneViews: milestoneResult.highestMilestoneViews,
      previouslyCreditedPayout,
      additionalPayout: 0,
      newCreditedPayout: previouslyCreditedPayout,
      currentBudgetSpent,
      newBudgetSpent: currentBudgetSpent,
      remainingBudget: remainingBudgetBeforeUpdate,
      status: 'INSUFFICIENT_BUDGET',
      message: `Campaign remaining budget is insufficient to cover the required payout. Payout capped at 0.`,
    };
  }

  // Sufficient budget available
  const newCreditedPayout = previouslyCreditedPayout + requiredAdditional;
  const newBudgetSpent = currentBudgetSpent + requiredAdditional;
  const newRemainingBudget = Math.max(0, totalBudget - newBudgetSpent);

  return {
    newViews,
    earnedMilestonePayout,
    highestMilestoneViews: milestoneResult.highestMilestoneViews,
    previouslyCreditedPayout,
    additionalPayout: requiredAdditional,
    newCreditedPayout,
    currentBudgetSpent,
    newBudgetSpent,
    remainingBudget: newRemainingBudget,
    status: 'CREDITED',
    message: `Milestone of ${milestoneResult.highestMilestoneViews.toLocaleString()} views reached. Additional payout credited.`,
  };
}
