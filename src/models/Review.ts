import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userImage: { type: String, default: '' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productSlug: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { 
      type: [String], 
      default: [] 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for efficient queries
reviewSchema.index({ productSlug: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // Prevent duplicate reviews

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
