// Product variants and add-ons utility functions

export interface VariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stockModifier: number;
  image?: string;
  specifications?: { name: string; value: string }[];
}

export interface Variant {
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: VariantOption[];
}

export interface AddonOption {
  label: string;
  price: number;
  description?: string;
  image?: string;
}

export interface Addon {
  name: string;
  description?: string;
  type: 'checkbox' | 'radio' | 'quantity';
  required: boolean;
  maxQuantity: number;
  options: AddonOption[];
}

export interface SelectedVariant {
  variantName: string;
  optionValue: string;
}

export interface SelectedAddon {
  addonName: string;
  optionLabel: string;
  quantity: number;
}

export interface ProductConfiguration {
  basePrice: number;
  baseStock: number;
  selectedVariants: SelectedVariant[];
  selectedAddons: SelectedAddon[];
  variants: Variant[];
  addons: Addon[];
}

/**
 * Calculate the final price based on selected variants and add-ons
 */
export function calculateFinalPrice(config: ProductConfiguration): number {
  let finalPrice = config.basePrice;

  // Add variant price modifiers
  config.selectedVariants.forEach(selectedVariant => {
    const variant = config.variants.find(v => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find(o => o.value === selectedVariant.optionValue);
      if (option) {
        finalPrice += option.priceModifier;
      }
    }
  });

  // Add addon prices
  config.selectedAddons.forEach(selectedAddon => {
    const addon = config.addons.find(a => a.name === selectedAddon.addonName);
    if (addon) {
      const option = addon.options.find(o => o.label === selectedAddon.optionLabel);
      if (option) {
        finalPrice += option.price * selectedAddon.quantity;
      }
    }
  });

  return Math.max(0, finalPrice);
}

/**
 * Calculate the available stock based on selected variants
 */
export function calculateAvailableStock(config: ProductConfiguration): number {
  let availableStock = config.baseStock;

  // Apply variant stock modifiers
  config.selectedVariants.forEach(selectedVariant => {
    const variant = config.variants.find(v => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find(o => o.value === selectedVariant.optionValue);
      if (option && option.stockModifier !== undefined) {
        availableStock = option.stockModifier;
      }
    }
  });

  return Math.max(0, availableStock);
}

/**
 * Get combined specifications from base product and selected variants
 */
export function getCombinedSpecifications(
  baseSpecifications: { name: string; value: string }[],
  config: ProductConfiguration
): { name: string; value: string }[] {
  const specifications = [...baseSpecifications];

  // Add variant-specific specifications
  config.selectedVariants.forEach(selectedVariant => {
    const variant = config.variants.find(v => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find(o => o.value === selectedVariant.optionValue);
      if (option && option.specifications) {
        option.specifications.forEach(spec => {
          // Check if specification already exists and update it, or add new one
          const existingSpecIndex = specifications.findIndex(s => s.name === spec.name);
          if (existingSpecIndex >= 0) {
            specifications[existingSpecIndex] = spec;
          } else {
            specifications.push(spec);
          }
        });
      }
    }
  });

  return specifications;
}

/**
 * Validate that all required variants are selected
 */
export function validateRequiredVariants(config: ProductConfiguration): {
  isValid: boolean;
  missingVariants: string[];
} {
  const missingVariants: string[] = [];

  config.variants.forEach(variant => {
    if (variant.required) {
      const isSelected = config.selectedVariants.some(
        sv => sv.variantName === variant.name
      );
      if (!isSelected) {
        missingVariants.push(variant.name);
      }
    }
  });

  return {
    isValid: missingVariants.length === 0,
    missingVariants
  };
}

/**
 * Validate that all required add-ons are selected
 */
export function validateRequiredAddons(config: ProductConfiguration): {
  isValid: boolean;
  missingAddons: string[];
} {
  const missingAddons: string[] = [];

  config.addons.forEach(addon => {
    if (addon.required) {
      const isSelected = config.selectedAddons.some(
        sa => sa.addonName === addon.name
      );
      if (!isSelected) {
        missingAddons.push(addon.name);
      }
    }
  });

  return {
    isValid: missingAddons.length === 0,
    missingAddons
  };
}

/**
 * Get the image URL for selected variant (if available)
 */
export function getVariantImage(config: ProductConfiguration, baseImages: string[]): string | null {
  for (const selectedVariant of config.selectedVariants) {
    const variant = config.variants.find(v => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find(o => o.value === selectedVariant.optionValue);
      if (option && option.image) {
        return option.image;
      }
    }
  }
  return baseImages[0] || null;
}

/**
 * Generate a configuration summary for display
 */
export function generateConfigurationSummary(config: ProductConfiguration): {
  variants: { name: string; value: string }[];
  addons: { name: string; option: string; quantity: number; price: number }[];
  totalPrice: number;
  availableStock: number;
} {
  const variants = config.selectedVariants.map(sv => {
    const variant = config.variants.find(v => v.name === sv.variantName);
    const option = variant?.options.find(o => o.value === sv.optionValue);
    return {
      name: sv.variantName,
      value: option?.label || sv.optionValue
    };
  });

  const addons = config.selectedAddons.map(sa => {
    const addon = config.addons.find(a => a.name === sa.addonName);
    const option = addon?.options.find(o => o.label === sa.optionLabel);
    return {
      name: sa.addonName,
      option: sa.optionLabel,
      quantity: sa.quantity,
      price: (option?.price || 0) * sa.quantity
    };
  });

  return {
    variants,
    addons,
    totalPrice: calculateFinalPrice(config),
    availableStock: calculateAvailableStock(config)
  };
}
