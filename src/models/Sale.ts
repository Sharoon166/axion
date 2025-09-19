import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categorySlugs: { type: [String], default: [] },
    productIds: { type: [String], default: [] },
    endsAt: { type: Date, required: true },
    discountPercent: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);
