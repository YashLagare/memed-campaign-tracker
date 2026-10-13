import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { CampaignPlatform } from './Campaign';

export type PayoutStatus = 'NONE' | 'PARTIAL' | 'COMPLETED' | 'INSUFFICIENT_BUDGET';

export interface ISubmission extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  postUrl: string;
  platform: CampaignPlatform;
  views: number;
  creditedPayout: number; // in paise (integer)
  lastMilestoneViews: number;
  payoutStatus: PayoutStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign reference is required'],
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
      index: true,
    },
    postUrl: {
      type: String,
      required: [true, 'Post URL is required'],
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ['Instagram', 'YouTube'],
        message: '{VALUE} is not a supported platform',
      },
      required: [true, 'Platform is required'],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative'],
    },
    creditedPayout: {
      type: Number,
      default: 0,
      min: [0, 'Credited payout cannot be negative'],
    },
    lastMilestoneViews: {
      type: Number,
      default: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'COMPLETED', 'INSUFFICIENT_BUDGET'],
      default: 'NONE',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Prevent submitting the same post URL twice to the same campaign
SubmissionSchema.index({ campaignId: 1, postUrl: 1 }, { unique: true });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
