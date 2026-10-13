import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type CampaignPlatform = 'Instagram' | 'YouTube';
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface IMilestone {
  views: number;
  payout: number; // in paise
}

export interface ICampaign extends Document {
  brandId: Types.ObjectId;
  name: string;
  platform: CampaignPlatform;
  totalBudget: number; // in paise (integer)
  budgetSpent: number; // in paise (integer)
  milestones: IMilestone[];
  status: CampaignStatus;
  remainingBudget: number; // virtual
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: [true, 'Milestone view threshold is required'],
      min: [1, 'Milestone views must be at least 1'],
    },
    payout: {
      type: Number,
      required: [true, 'Milestone payout is required'],
      min: [1, 'Milestone payout must be positive (in paise)'],
    },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Brand reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [2, 'Campaign name must be at least 2 characters long'],
      maxlength: [120, 'Campaign name cannot exceed 120 characters'],
    },
    platform: {
      type: String,
      enum: {
        values: ['Instagram', 'YouTube'],
        message: '{VALUE} is not a supported platform. Supported: Instagram, YouTube',
      },
      required: [true, 'Platform is required'],
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [100, 'Total budget must be at least ₹1 (100 paise)'],
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: [0, 'Budget spent cannot be negative'],
    },
    milestones: {
      type: [MilestoneSchema],
      required: [true, 'At least one milestone is required'],
      validate: {
        validator: function (milestones: IMilestone[]) {
          return Array.isArray(milestones) && milestones.length > 0;
        },
        message: 'A campaign must have at least one milestone',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'PAUSED', 'COMPLETED'],
        message: '{VALUE} is not a valid campaign status',
      },
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining budget: totalBudget - budgetSpent
CampaignSchema.virtual('remainingBudget').get(function (this: ICampaign) {
  return Math.max(0, this.totalBudget - (this.budgetSpent || 0));
});

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
