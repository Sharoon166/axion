import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true }, // Base price
    description: String,
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategories: [{ type: String }],
    stock: { type: Number, default: 0 }, // Base stock
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    
    // Enhanced variants system
    variants: [{
      name: { type: String, required: true }, // e.g., "Color", "Size", "Material"
      type: { type: String, enum: ['color', 'size', 'text', 'dropdown'], default: 'dropdown' },
      required: { type: Boolean, default: false },
      options: [{
        label: { type: String, required: true }, // e.g., "Red", "Large", "Cotton"
        value: { type: String, required: true }, // e.g., "#ff0000", "L", "cotton"
        priceModifier: { type: Number, default: 0 }, // Price change for this option
        stockModifier: { type: Number, default: 0 }, // Stock change for this option
        image: { type: String }, // Optional image for this variant option
        specifications: [{ // Variant-specific specifications
          name: { type: String, required: true },
          value: { type: String, required: true }
        }]
      }]
    }],
    
    // Enhanced add-ons system
    addons: [{
      name: { type: String, required: true }, // e.g., "Extended Warranty", "Gift Wrapping"
      description: { type: String }, // Description of the add-on
      type: { type: String, enum: ['checkbox', 'radio', 'quantity'], default: 'checkbox' },
      required: { type: Boolean, default: false },
      maxQuantity: { type: Number, default: 1 }, // For quantity type add-ons
      options: [{
        label: { type: String, required: true }, // e.g., "2 Year Warranty", "Premium Gift Box"
        price: { type: Number, required: true }, // Additional price for this add-on
        description: { type: String }, // Detailed description
        image: { type: String } // Optional image for the add-on
      }]
    }],
    
    // Legacy fields for backward compatibility
    colors: [String],
    sizes: [String],
    
    specifications: [{
      name: { type: String, required: true },
      value: { type: String, required: true }
    }],
    shipping: {
      weight: { type: Number },
      dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
      },
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
      estimatedDelivery: { type: String },
      returnPolicy: { type: String }
    },
    reviews: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      userName: { type: String, required: true },
      userEmail: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', productSchema);