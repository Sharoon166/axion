# Product Variants and Add-ons System

## Overview
This system allows products to have configurable variants (like color, size, material) and add-ons (like warranties, gift wrapping) with dynamic pricing and specifications.

## Features Implemented

### 1. Database Schema Enhancement
- Enhanced `Products.ts` model with `variants` and `addons` arrays
- Support for variant-specific pricing, stock, images, and specifications
- Flexible add-on system with different types (checkbox, radio, quantity)
- Backward compatibility with existing `colors` and `sizes` fields

### 2. Frontend Components
- **VariantSelector**: Handles different variant types (color, size, text, dropdown)
- **AddonSelector**: Manages add-on selection with pricing display
- **PriceSummary**: Shows price breakdown with variants and add-ons
- **VariantManager**: Admin interface for managing variants
- **AddonManager**: Admin interface for managing add-ons

### 3. Utility Functions (`productVariants.ts`)
- `calculateFinalPrice()`: Computes total price with variants and add-ons
- `calculateAvailableStock()`: Determines stock based on variant selection
- `getCombinedSpecifications()`: Merges base and variant-specific specs
- `validateRequiredVariants()` & `validateRequiredAddons()`: Validation helpers
- `getVariantImage()`: Gets variant-specific images
- `generateConfigurationSummary()`: Creates display summary

### 4. Enhanced Cart System
- Updated `CartItem` interface to include variants and add-ons
- Smart comparison logic for cart items with same product but different configurations
- Proper handling of variant-specific pricing in cart

### 5. Product Page Integration
- Dynamic price updates based on variant/add-on selection
- Variant-specific stock management
- Combined specifications display
- Validation for required selections
- Enhanced add-to-cart functionality

## Usage Examples

### Creating a Product with Variants

```javascript
const productWithVariants = {
  name: "Premium T-Shirt",
  price: 25.00, // Base price
  variants: [
    {
      name: "Color",
      type: "color",
      required: true,
      options: [
        {
          label: "Red",
          value: "#ff0000",
          priceModifier: 0,
          stockModifier: 50
        },
        {
          label: "Blue",
          value: "#0000ff",
          priceModifier: 2.00, // $2 extra for blue
          stockModifier: 30
        }
      ]
    },
    {
      name: "Size",
      type: "size",
      required: true,
      options: [
        {
          label: "Small",
          value: "S",
          priceModifier: 0,
          stockModifier: 20
        },
        {
          label: "Large",
          value: "L",
          priceModifier: 3.00, // $3 extra for large
          stockModifier: 15,
          specifications: [
            { name: "Chest Width", value: "22 inches" }
          ]
        }
      ]
    }
  ],
  addons: [
    {
      name: "Gift Options",
      type: "checkbox",
      required: false,
      options: [
        {
          label: "Gift Wrapping",
          price: 5.00,
          description: "Beautiful gift wrapping with ribbon"
        },
        {
          label: "Gift Card",
          price: 2.00,
          description: "Personalized gift card"
        }
      ]
    }
  ]
};
```

### Price Calculation Example

```javascript
const configuration = {
  basePrice: 25.00,
  baseStock: 100,
  selectedVariants: [
    { variantName: "Color", optionValue: "#0000ff" }, // Blue (+$2)
    { variantName: "Size", optionValue: "L" }         // Large (+$3)
  ],
  selectedAddons: [
    { addonName: "Gift Options", optionLabel: "Gift Wrapping", quantity: 1 } // +$5
  ],
  variants: productVariants,
  addons: productAddons
};

const finalPrice = calculateFinalPrice(configuration); // $35.00
const availableStock = calculateAvailableStock(configuration); // 15 (from Large size)
```

## Admin Interface Usage

### Managing Variants
1. Use `VariantManager` component in admin product forms
2. Add variants with different types (color, size, text, dropdown)
3. Configure price modifiers and stock overrides
4. Add variant-specific specifications and images

### Managing Add-ons
1. Use `AddonManager` component in admin product forms
2. Create different add-on types:
   - **Checkbox**: Multiple selections allowed
   - **Radio**: Single selection only
   - **Quantity**: Quantity-based pricing
3. Set pricing and descriptions for each option

## API Integration

The system automatically handles variants and add-ons in:
- Product creation (`POST /api/products`)
- Product updates (`PUT /api/products/[slug]`)
- Product retrieval (`GET /api/products/[slug]`)

## Cart Integration

When adding to cart, the system:
1. Validates required variant selections
2. Validates required add-on selections
3. Calculates final price including all modifiers
4. Stores complete configuration for order processing
5. Handles duplicate detection with same product but different configurations

## Specifications System

Specifications can be:
- **Base specifications**: Apply to all variants
- **Variant-specific**: Override or add to base specifications
- **Dynamic**: Change based on selected variants

The `getCombinedSpecifications()` function merges these intelligently.

## Backward Compatibility

The system maintains compatibility with existing products using:
- Legacy `colors` and `sizes` arrays
- Fallback to old system when no variants are defined
- Gradual migration path for existing products

## Best Practices

1. **Variant Design**: Keep variants simple and intuitive
2. **Pricing Strategy**: Use price modifiers thoughtfully
3. **Stock Management**: Set realistic stock levels per variant
4. **Add-on Grouping**: Group related add-ons logically
5. **Validation**: Always validate required selections
6. **Performance**: Consider caching for complex calculations

## Testing

The system includes comprehensive validation and error handling:
- Required variant validation
- Required add-on validation
- Stock availability checks
- Price calculation accuracy
- Cart item comparison logic

This implementation provides a robust, scalable system for managing product variants and add-ons with dynamic pricing and specifications.
