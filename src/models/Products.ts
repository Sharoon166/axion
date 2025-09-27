import mongoose from 'mongoose';

// TypeScript interfaces for variant structures
interface Specification {
  name: string;
  value: string;
}

interface SubSubVariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  customProperties: Record<string, unknown>;
  specifications: Specification[];
}

interface SubSubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SubSubVariantOption[];
}

interface SubVariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  subSubVariants: SubSubVariant[];
  customProperties: Record<string, unknown>;
  specifications: Specification[];
}

interface SubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SubVariantOption[];
}

interface VariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  subVariants: SubVariant[] | string | undefined;
  customProperties: Record<string, unknown>;
  specifications: Specification[];
  // Allow for legacy fields that might exist
  stockModifier?: number;
}

interface Variant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: VariantOption[];
}

interface AddonOption {
  label: string;
  price: number;
  description?: string;
  image?: string;
}

interface Addon {
  name: string;
  description?: string;
  type: 'checkbox' | 'radio' | 'quantity';
  required: boolean;
  maxQuantity: number;
  options: AddonOption[];
}

interface Review {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface Shipping {
  weight?: number;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
  };
  freeShipping: boolean;
  shippingCost: number;
  estimatedDelivery?: string;
  returnPolicy?: string;
}

interface ProductDocument {
  name: string;
  slug: string;
  price: number;
  description?: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  subcategories: string[];
  featured: boolean;
  rating: number;
  numReviews: number;
  variants: Variant[];
  addons: Addon[];
  colors: string[];
  sizes: string[];
  specifications: Specification[];
  shipping: Shipping;
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true }, // Base price
    description: String,
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategories: [{ type: String }],
    // Removed base stock - now handled at variant level
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    // Enhanced variants system with flexible properties
    variants: [{
      name: { type: String, required: true }, // e.g., "Color", "Size", "Material"
      type: { type: String, enum: ['color', 'size', 'text', 'dropdown'], default: 'dropdown' },
      required: { type: Boolean, default: false },
      options: [{
        label: { type: String, required: true }, // e.g., "Red", "Large", "Cotton"
        value: { type: String, required: true }, // e.g., "#ff0000", "L", "cotton"
        priceModifier: { type: Number, default: 0 }, // Price change for this option
        stock: { type: Number, required: true, default: 0 }, // Individual stock for this variant option
        image: { type: String }, // Optional image for this variant option
        sku: { type: String }, // Unique SKU for this variant option
        // Sub-variants for nested variant structure (up to 3 levels)
        subVariants: [{
          name: { type: String, required: true }, // e.g., "Size", "Material"
          type: { type: String, enum: ['color', 'size', 'text', 'dropdown'], default: 'dropdown' },
          required: { type: Boolean, default: false },
          options: [{
            label: { type: String, required: true },
            value: { type: String, required: true },
            priceModifier: { type: Number, default: 0 },
            stock: { type: Number, required: true, default: 0 }, // Individual stock for sub-variant
            image: { type: String },
            sku: { type: String },
            // Sub-sub-variants for third level nesting
            subSubVariants: [{
              name: { type: String, required: true }, // e.g., "Finish", "Grade"
              type: { type: String, enum: ['color', 'size', 'text', 'dropdown'], default: 'dropdown' },
              required: { type: Boolean, default: false },
              options: [{
                label: { type: String, required: true },
                value: { type: String, required: true },
                priceModifier: { type: Number, default: 0 },
                stock: { type: Number, required: true, default: 0 }, // Individual stock for sub-sub-variant
                image: { type: String },
                sku: { type: String },
                customProperties: { type: mongoose.Schema.Types.Mixed, default: {} },
                specifications: [{
                  name: { type: String, required: true },
                  value: { type: String, required: true }
                }]
              }]
            }],
            customProperties: { type: mongoose.Schema.Types.Mixed, default: {} },
            specifications: [{
              name: { type: String, required: true },
              value: { type: String, required: true }
            }]
          }]
        }],
        // Flexible custom properties - can store any additional data
        customProperties: { type: mongoose.Schema.Types.Mixed, default: {} },
        specifications: [{ // Variant-specific specifications (legacy support)
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

// Add index for price field
productSchema.index({ price: 1 });

// Force schema update by adding a version
productSchema.set('versionKey', '__v');

// Ensure strict mode to prevent unknown fields
productSchema.set('strict', true);

// Add transform to ensure correct field mapping and convert complex sub-variants to text
productSchema.set('toJSON', {
  transform: function (doc: mongoose.Document & ProductDocument, ret: ProductDocument & { _id: mongoose.Types.ObjectId; __v: number }) {
    // Ensure variants use 'stock' instead of 'stockModifier' and convert complex sub-variants to text
    if (ret.variants && Array.isArray(ret.variants)) {
      for (let i = 0; i < ret.variants.length; i++) {
        const variant = ret.variants[i] as Variant;
        if (variant.options && Array.isArray(variant.options)) {
          for (let j = 0; j < variant.options.length; j++) {
            const option = variant.options[j] as VariantOption;
            // Remove stockModifier if it exists and use stock instead
            if ('stockModifier' in option) {
              delete option.stockModifier;
            }
            // Preserve nested subVariants structure for client consumers
          }
        }
      }
    }
    return ret;
  }
});

// Force model recompilation by deleting cached model
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

// Pre-save middleware to ensure correct field structure and convert complex sub-variants to text
productSchema.pre('save', function (next) {
  const doc = this as mongoose.Document & ProductDocument;
  if (doc.variants) {
    for (let i = 0; i < doc.variants.length; i++) {
      const variant = doc.variants[i] as Variant;
      if (variant.options) {
        const options = variant.options as VariantOption[];
        for (let j = 0; j < options.length; j++) {
          const option = options[j] as VariantOption & Record<string, unknown>;
          // Convert stockModifier to stock if it exists
          if (option.stockModifier && typeof option.stockModifier === 'number' && !option.stock) {
            option.stock = option.stockModifier;
            delete option.stockModifier;
          }
          // Preserve nested subVariants structure for client consumers
        }
      }
    }
  }
  next();
});

export default mongoose.model('Product', productSchema);