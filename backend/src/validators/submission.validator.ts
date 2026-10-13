import { z } from 'zod';
import mongoose from 'mongoose';

export const createSubmissionSchema = z.object({
  campaignId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid campaign ID format',
  }),
  postUrl: z
    .string()
    .trim()
    .url('Post link must be a valid URL')
    .refine((url) => {
      const lower = url.toLowerCase();
      return (
        lower.includes('instagram.com') ||
        lower.includes('youtube.com') ||
        lower.includes('youtu.be')
      );
    }, {
      message: 'Post URL must be an Instagram or YouTube link',
    }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
