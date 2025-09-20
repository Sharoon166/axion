import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const orderSchema = new mongoose.Schema(
  {
    orderId: { 
      type: String, 
      required: true, 
      unique: true,
      default: () => `ORD_${nanoid(8).toUpperCase()}`
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    customerEmail: { type: String, required: false },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        quantity: { type: Number, required: true },
        color: { type: String, required: false },
        size: { type: String, required: false },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        // Optional sale metadata per item
        saleName: { type: String, required: false },
        salePercent: { type: Number, required: false },
        product: {
          type: String,
          required: true,
        },
        // Variant information for stock restoration
        variants: [
          {
            variantName: { type: String, required: true }, // e.g., "Color", "Size"
            optionValue: { type: String, required: true }, // e.g., "Red", "Large"
            optionLabel: { type: String, required: false }, // e.g., "Red", "Large"
          },
        ],
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: false, default: 'Pakistan' },
      phone: { type: String, required: false },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    isConfirmed: { type: Boolean, default: false },
    isShipped: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    isCancelled: { type: Boolean, default: false },
    paidAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    refund: {
      amount: Number,
      reason: String,
      processedAt: Date,
      status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    },
    shipping: {
      trackingNumber: String,
      carrier: String,
      updatedAt: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
