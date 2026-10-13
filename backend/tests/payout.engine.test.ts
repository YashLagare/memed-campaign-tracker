import { describe, test, expect } from '@jest/globals';
import {
  calculateMilestonePayout,
  calculateIncrementalPayout,
  validateMilestoneLadder,
} from '../src/services/payout.engine';
import { IMilestone } from '../src/models/Campaign';

describe('Milestone Payout Engine & Budget Cap Protection', () => {
  // Standard test milestone ladder (in paise: 10K -> ₹500 = 50,000 paise, 50K -> ₹2000 = 200,000 paise, 100K -> ₹5000 = 500,000 paise)
  const sampleMilestones: IMilestone[] = [
    { views: 10000, payout: 50000 },
    { views: 50000, payout: 200000 },
    { views: 100000, payout: 500000 },
  ];

  // Total campaign budget: ₹10,000 = 1,000,000 paise
  const defaultTotalBudget = 1000000;

  // 1. Views below first milestone
  test('Case 1: Views below first milestone yield zero payout', () => {
    const result = calculateMilestonePayout(5000, sampleMilestones);
    expect(result.earnedPayout).toBe(0);
    expect(result.highestMilestoneViews).toBe(0);
    expect(result.milestoneIndex).toBe(-1);

    const incremental = calculateIncrementalPayout({
      newViews: 5000,
      currentViews: 0,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 0,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 0,
    });
    expect(incremental.additionalPayout).toBe(0);
    expect(incremental.newCreditedPayout).toBe(0);
    expect(incremental.status).toBe('ZERO_BELOW_FIRST_MILESTONE');
  });

  // 2. Views exactly at first milestone
  test('Case 2: Views exactly at first milestone yield first milestone payout', () => {
    const result = calculateMilestonePayout(10000, sampleMilestones);
    expect(result.earnedPayout).toBe(50000); // ₹500
    expect(result.highestMilestoneViews).toBe(10000);
    expect(result.milestoneIndex).toBe(0);

    const incremental = calculateIncrementalPayout({
      newViews: 10000,
      currentViews: 0,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 0,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 0,
    });
    expect(incremental.additionalPayout).toBe(50000);
    expect(incremental.newCreditedPayout).toBe(50000);
    expect(incremental.status).toBe('CREDITED');
  });

  // 3. Views between milestones
  test('Case 3: Views between milestones yield highest milestone reached (not next tier)', () => {
    const result = calculateMilestonePayout(30000, sampleMilestones);
    expect(result.earnedPayout).toBe(50000); // ₹500 (still tier 1)
    expect(result.highestMilestoneViews).toBe(10000);
    expect(result.milestoneIndex).toBe(0);
  });

  // 4. Views at second milestone
  test('Case 4: Views at second milestone yield second milestone payout', () => {
    const result = calculateMilestonePayout(50000, sampleMilestones);
    expect(result.earnedPayout).toBe(200000); // ₹2,000
    expect(result.highestMilestoneViews).toBe(50000);
    expect(result.milestoneIndex).toBe(1);
  });

  // 5. Views above highest milestone
  test('Case 5: Views above highest milestone yield highest tier payout', () => {
    const result = calculateMilestonePayout(150000, sampleMilestones);
    expect(result.earnedPayout).toBe(500000); // ₹5,000
    expect(result.highestMilestoneViews).toBe(100000);
    expect(result.milestoneIndex).toBe(2);
  });

  // 6. Multiple milestones crossed in one update
  test('Case 6: Crossing multiple milestones in a single update pays highest crossed milestone', () => {
    // Jump directly from 0 to 100,000 views
    const incremental = calculateIncrementalPayout({
      newViews: 100000,
      currentViews: 0,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 0,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 0,
    });
    // Highest crossed is 500,000 paise (₹5,000), not the sum (500 + 2000 + 5000 = 7500)
    expect(incremental.additionalPayout).toBe(500000);
    expect(incremental.newCreditedPayout).toBe(500000);
    expect(incremental.highestMilestoneViews).toBe(100000);
    expect(incremental.status).toBe('CREDITED');
  });

  // 7. Incremental payout calculation
  test('Case 7: Incremental payout pays difference between new milestone and previously credited', () => {
    // Creator already received ₹500 (50,000 paise) for 10K views
    // Views now reach 50,000 (qualifying for ₹2,000 = 200,000 paise)
    const incremental = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 50000,
    });
    // Expected additional: 200,000 - 50,000 = 150,000 paise (₹1,500)
    expect(incremental.additionalPayout).toBe(150000);
    expect(incremental.newCreditedPayout).toBe(200000);
    expect(incremental.newBudgetSpent).toBe(200000);
    expect(incremental.status).toBe('CREDITED');
  });

  // 8. Repeated view update
  test('Case 8: Repeated view update results in zero additional payout', () => {
    // Creator is at 50,000 views with 200,000 paise credited
    // Crawler reports 50,000 views again
    const incremental = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 50000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 200000,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 200000,
    });
    expect(incremental.additionalPayout).toBe(0);
    expect(incremental.newCreditedPayout).toBe(200000);
    expect(incremental.newBudgetSpent).toBe(200000);
    expect(incremental.status).toBe('NO_NEW_MILESTONE');
  });

  // 9. Zero additional payout
  test('Case 9: View count increases within same milestone tier yields zero additional payout', () => {
    // Views increase from 10,000 to 25,000 (both in tier 1)
    const incremental = calculateIncrementalPayout({
      newViews: 25000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget: defaultTotalBudget,
      currentBudgetSpent: 50000,
    });
    expect(incremental.additionalPayout).toBe(0);
    expect(incremental.newCreditedPayout).toBe(50000);
    expect(incremental.status).toBe('NO_NEW_MILESTONE');
  });

  // 10. Sufficient remaining budget
  test('Case 10: Sufficient remaining budget allows full incremental payout', () => {
    // Campaign has total budget ₹10,000, spent ₹1,000, remaining ₹9,000
    // Additional payout required: ₹1,500 (150,000 paise)
    const incremental = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget: 1000000,
      currentBudgetSpent: 100000,
    });
    expect(incremental.additionalPayout).toBe(150000);
    expect(incremental.newBudgetSpent).toBe(250000);
    expect(incremental.remainingBudget).toBe(750000);
    expect(incremental.status).toBe('CREDITED');
  });

  // 11. Insufficient remaining budget
  test('Case 11: Insufficient remaining budget blocks payout without partial credit (all-or-nothing)', () => {
    // Campaign total budget is ₹2,000 (200,000 paise)
    // Budget already spent is ₹1,000 (100,000 paise) -> Remaining budget is ₹1,000 (100,000 paise)
    // Creator was credited ₹500, now crosses 50K milestone (requires additional ₹1,500 = 150,000 paise)
    // Since 150,000 > 100,000, additional payout must be 0!
    const incremental = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget: 200000,
      currentBudgetSpent: 100000,
    });
    expect(incremental.additionalPayout).toBe(0);
    expect(incremental.newCreditedPayout).toBe(50000); // Unchanged
    expect(incremental.newBudgetSpent).toBe(100000); // Unchanged
    expect(incremental.remainingBudget).toBe(100000); // Unchanged
    expect(incremental.status).toBe('INSUFFICIENT_BUDGET');
  });

  // 12. Budget exactly equal to payout
  test('Case 12: Budget exactly equal to required payout credits full amount and reaches zero remaining', () => {
    // Remaining budget is exactly ₹1,500 (150,000 paise)
    // Total budget: 200,000 paise, spent: 50,000 paise -> remaining: 150,000 paise
    // Required additional: 150,000 paise
    const incremental = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget: 200000,
      currentBudgetSpent: 50000,
    });
    expect(incremental.additionalPayout).toBe(150000);
    expect(incremental.newCreditedPayout).toBe(200000);
    expect(incremental.newBudgetSpent).toBe(200000);
    expect(incremental.remainingBudget).toBe(0);
    expect(incremental.status).toBe('CREDITED');
  });

  // 13. Prevention of overspending
  test('Case 13: Budget spent can never exceed total budget across repeated calls', () => {
    const totalBudget = 500000; // ₹5,000
    let currentSpent = 450000; // ₹4,500 already spent

    // Attempt to credit 150,000 paise (exceeds remaining 50,000)
    const result = calculateIncrementalPayout({
      newViews: 50000,
      currentViews: 10000,
      milestones: sampleMilestones,
      previouslyCreditedPayout: 50000,
      totalBudget,
      currentBudgetSpent: currentSpent,
    });

    expect(result.additionalPayout).toBe(0);
    expect(result.newBudgetSpent).toBeLessThanOrEqual(totalBudget);
    expect(result.status).toBe('INSUFFICIENT_BUDGET');
  });

  // 14. Invalid view counts
  test('Case 14: Invalid view counts are strictly rejected', () => {
    // Negative views
    expect(() => calculateMilestonePayout(-100, sampleMilestones)).toThrow('Views count cannot be negative');

    // Decreasing view count
    expect(() =>
      calculateIncrementalPayout({
        newViews: 5000,
        currentViews: 10000,
        milestones: sampleMilestones,
        previouslyCreditedPayout: 50000,
        totalBudget: defaultTotalBudget,
        currentBudgetSpent: 50000,
      })
    ).toThrow(/cannot be less than existing views/);
  });

  // 15. Invalid milestone configurations
  test('Case 15: Invalid milestone configurations are detected and rejected', () => {
    // Empty ladder
    expect(validateMilestoneLadder([]).valid).toBe(false);

    // Non-increasing views
    const nonIncreasingViews: IMilestone[] = [
      { views: 50000, payout: 1000 },
      { views: 20000, payout: 2000 },
    ];
    expect(validateMilestoneLadder(nonIncreasingViews).valid).toBe(false);

    // Non-increasing payouts
    const nonIncreasingPayouts: IMilestone[] = [
      { views: 10000, payout: 2000 },
      { views: 50000, payout: 1000 },
    ];
    expect(validateMilestoneLadder(nonIncreasingPayouts).valid).toBe(false);

    // Duplicate view thresholds
    const duplicateViews: IMilestone[] = [
      { views: 10000, payout: 500 },
      { views: 10000, payout: 1000 },
    ];
    expect(validateMilestoneLadder(duplicateViews).valid).toBe(false);

    // Non-positive values
    const nonPositive: IMilestone[] = [
      { views: -10, payout: 500 },
    ];
    expect(validateMilestoneLadder(nonPositive).valid).toBe(false);
  });
});
