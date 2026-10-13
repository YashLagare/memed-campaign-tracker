import { z } from 'zod';

export const milestoneItemSchema = z.object({
  views: z.number().int('Views must be an integer').positive('Views must be greater than 0'),
  payout: z.number().positive('Payout must be greater than 0'), // in Rupees from API input
});

export const createCampaignSchema = z
  .object({
    name: z.string().trim().min(2, 'Campaign name must be at least 2 characters long').max(120, 'Campaign name cannot exceed 120 characters'),
    platform: z.enum(['Instagram', 'YouTube'], {
      errorMap: () => ({ message: "Platform must be either 'Instagram' or 'YouTube'" }),
    }),
    totalBudget: z.number().positive('Total budget must be greater than 0'), // in Rupees
    milestones: z
      .array(milestoneItemSchema)
      .min(1, 'A campaign must have at least one milestone'),
  })
  .superRefine((data, ctx) => {
    // Sort milestones by views to validate order
    const milestones = [...data.milestones];

    for (let i = 0; i < milestones.length; i++) {
      if (i > 0) {
        if (milestones[i].views <= milestones[i - 1].views) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Milestone at index ${i} views (${milestones[i].views}) must be strictly greater than preceding milestone (${milestones[i - 1].views})`,
            path: ['milestones', i, 'views'],
          });
        }

        if (milestones[i].payout <= milestones[i - 1].payout) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Milestone at index ${i} payout (₹${milestones[i].payout}) must be strictly greater than preceding milestone payout (₹${milestones[i - 1].payout})`,
            path: ['milestones', i, 'payout'],
          });
        }
      }

      if (milestones[i].payout > data.totalBudget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Milestone payout (₹${milestones[i].payout}) cannot exceed total campaign budget (₹${data.totalBudget})`,
          path: ['milestones', i, 'payout'],
        });
      }
    }
  });

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
