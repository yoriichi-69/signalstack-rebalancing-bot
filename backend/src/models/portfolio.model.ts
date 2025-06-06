import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset {
  symbol: string;
  weight: number;
  currentPrice?: number;
  quantity?: number;
}

export interface IPortfolio extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  assets: IAsset[];
  totalValue?: number;
  lastRebalanced?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<IPortfolio>(
  {
    name: {
      type: String,
      required: [true, 'Portfolio name is required'],
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assets: [
      {
        symbol: {
          type: String,
          required: [true, 'Asset symbol is required'],
          uppercase: true,
        },
        weight: {
          type: Number,
          required: [true, 'Asset weight is required'],
          min: [0, 'Weight cannot be negative'],
          max: [1, 'Weight cannot be greater than 1'],
        },
        currentPrice: {
          type: Number,
          default: 0,
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalValue: {
      type: Number,
      default: 0,
    },
    lastRebalanced: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure weights sum to 1
portfolioSchema.pre('save', function (next) {
  const totalWeight = this.assets.reduce((sum, asset) => sum + asset.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.0001) {
    next(new Error('Asset weights must sum to 1'));
  }
  next();
});

export default mongoose.model<IPortfolio>('Portfolio', portfolioSchema); 