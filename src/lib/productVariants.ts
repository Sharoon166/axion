// Product variants and add-ons utility functions

export interface VariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number; // Individual stock for this specific variant option
  image?: string;
  sku?: string;
  // Sub-variants for nested variant structure - can be string (text format) or array (complex format)
  subVariants?: SubVariant[] | string;
  // Flexible custom properties - can be any type
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
  // Align type with Variant's type union for consistency across the app
  type: 'color' | 'size' | 'text' | 'dropdown';
  // Indexing fields are UI helpers; make them optional so construction doesn't require them
  optionIndex?: number;
  variantIndex?: number;
  subVariantIndex?: number;
  subSubVariantIndex?: number;
  subOptionIndex?: number;
}

export interface SubVariant {
  _id: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SubVariantOption[];
}

export interface SubSubVariantOption {
  name: string;
  options: SubSubVariantOption[];
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number; // Individual stock for this specific sub-sub-variant option
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
}

export interface SubSubVariant {
  _id: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SubSubVariantOption[];
}

export interface SubVariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number; // Individual stock for this specific sub-variant option
  image?: string;
  sku?: string;
  subSubVariants?: SubSubVariant[]; // Third level of nesting
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
}

export interface Variant {
  _id: string;
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
  subVariants?: SelectedSubVariant[];
  optionLabel?: string;
  optionDetails?: {
    priceModifier: number;
    sku: string;
    customProperties: Record<string, unknown>;
  };
  subSubVariants?: SelectedSubSubVariant[];
}

export interface SelectedSubSubVariant {
  subSubVariantName: string;
  optionDetails?: {
    priceModifier: number;
    sku: string;
    customProperties: Record<string, unknown>;
  };
  optionValue: string;
}

export interface SelectedSubVariant {
  subVariantName: string;
  optionDetails?: {
    priceModifier: number;
    sku: string;
    customProperties: Record<string, unknown>;
  };
  optionValue: string;
  subSubVariants?: SelectedSubSubVariant[];
}

export interface SelectedAddon {
  addonName: string;
  optionLabel: string;
  quantity: number;
}

export interface ProductConfiguration {
  basePrice: number;
  selectedVariants: SelectedVariant[];
  selectedAddons: SelectedAddon[];
  variants: Variant[];
  addons: Addon[];
}


export function calculateFinalPrice(config: ProductConfiguration): number {
  let finalPrice = config.basePrice;

  config.selectedVariants.forEach((selectedVariant) => {
    const variant = config.variants.find((v) => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find((o) => o.value === selectedVariant.optionValue);
      if (option) {
        finalPrice += option.priceModifier;

        // Add sub-variant price modifiers
        if (selectedVariant.subVariants && selectedVariant.subVariants.length > 0) {
          selectedVariant.subVariants.forEach((selectedSubVariant) => {
            if (Array.isArray(option.subVariants)) {
              const subVariant = option.subVariants.find(
                (sv: SubVariant) => sv.name === selectedSubVariant.subVariantName,
              );
              if (subVariant) {
                const subOption = subVariant.options.find(
                  (so: SubVariantOption) => so.value === selectedSubVariant.optionValue,
                );
                if (subOption) {
                  finalPrice += subOption.priceModifier;

                  // Add sub-sub-variant price modifiers
                  if (selectedSubVariant.subSubVariants && selectedSubVariant.subSubVariants.length > 0) {
                    selectedSubVariant.subSubVariants.forEach((selectedSubSubVariant) => {
                      const subSubVariant = subOption.subSubVariants?.find(
                        (ssv) => ssv.name === selectedSubSubVariant.subSubVariantName,
                      );
                      if (subSubVariant) {
                        const subSubOption = subSubVariant.options.find(
                          (sso) => sso.value === selectedSubSubVariant.optionValue,
                        );
                        if (subSubOption) {
                          finalPrice += subSubOption.priceModifier;
                        }
                      }
                    });
                  }
                }
              }
            }
          });
        }
      }
    }
  });

  config.selectedAddons.forEach((selectedAddon) => {
    const addon = config.addons.find((a) => a.name === selectedAddon.addonName);
    if (addon) {
      const option = addon.options.find((o) => o.label === selectedAddon.optionLabel);
      if (option) {
        finalPrice += option.price * selectedAddon.quantity;
      }
    }
  });

  return Math.max(0, finalPrice);
}

export function calculateAvailableStock(config: ProductConfiguration): number {
  if (config.selectedVariants.length === 0) {
    return 0;
  }

  let minStock = Infinity;

  // Find the minimum stock among all selected variants
  config.selectedVariants.forEach((selectedVariant) => {
    const variant = config.variants.find((v) => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find((o) => o.value === selectedVariant.optionValue);
      if (option) {
        // Check sub-variants if they exist
        if (selectedVariant.subVariants && selectedVariant.subVariants.length > 0) {
          selectedVariant.subVariants.forEach((selectedSubVariant) => {
            // Type guard to ensure subVariants is an array of SubVariant objects
            if (Array.isArray(option.subVariants)) {
              const subVariant = option.subVariants.find(
                (sv: SubVariant) => sv.name === selectedSubVariant.subVariantName,
              );
              if (subVariant) {
                const subOption = subVariant.options.find(
                  (so: SubVariantOption) => so.value === selectedSubVariant.optionValue,
                );
                if (subOption) {
                  // Check sub-sub-variants if they exist
                  if (selectedSubVariant.subSubVariants && selectedSubVariant.subSubVariants.length > 0) {
                    selectedSubVariant.subSubVariants.forEach((selectedSubSubVariant) => {
                      const subSubVariant = subOption.subSubVariants?.find(
                        (ssv) => ssv.name === selectedSubSubVariant.subSubVariantName,
                      );
                      if (subSubVariant) {
                        const subSubOption = subSubVariant.options.find(
                          (sso) => sso.value === selectedSubSubVariant.optionValue,
                        );
                        if (subSubOption) {
                          minStock = Math.min(minStock, subSubOption.stock);
                        }
                      }
                    });
                  } else {
                    minStock = Math.min(minStock, subOption.stock);
                  }
                }
              }
            }
          });
        } else {
          minStock = Math.min(minStock, option.stock);
        }
      }
    }
  });

  return minStock === Infinity ? 0 : Math.max(0, minStock);
}

/**
 * Get combined specifications from base product and selected variants
 */
export function getCombinedSpecifications(
  baseSpecifications: { name: string; value: string }[],
  config: ProductConfiguration,
): { name: string; value: string }[] {
  const specifications = [...baseSpecifications];

  // Add variant-specific specifications
  config.selectedVariants.forEach((selectedVariant) => {
    const variant = config.variants.find((v) => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find((o) => o.value === selectedVariant.optionValue);
      if (option && option.specifications) {
        option.specifications.forEach((spec) => {
          // Check if specification already exists and update it, or add new one
          const existingSpecIndex = specifications.findIndex((s) => s.name === spec.name);
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

  config.variants.forEach((variant) => {
    if (variant.required) {
      const isSelected = config.selectedVariants.some((sv) => sv.variantName === variant.name);
      if (!isSelected) {
        missingVariants.push(variant.name);
      }
    }
  });

  return {
    isValid: missingVariants.length === 0,
    missingVariants,
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

  config.addons.forEach((addon) => {
    if (addon.required) {
      const isSelected = config.selectedAddons.some((sa) => sa.addonName === addon.name);
      if (!isSelected) {
        missingAddons.push(addon.name);
      }
    }
  });

  return {
    isValid: missingAddons.length === 0,
    missingAddons,
  };
}

/**
 * Get the image URL for selected variant (if available)
 */
export function getVariantImage(config: ProductConfiguration, baseImages: string[]): string | null {
  for (const selectedVariant of config.selectedVariants) {
    const variant = config.variants.find((v) => v.name === selectedVariant.variantName);
    if (variant) {
      const option = variant.options.find((o) => o.value === selectedVariant.optionValue);
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
  const variants = config.selectedVariants.map((sv) => {
    const variant = config.variants.find((v) => v.name === sv.variantName);
    const option = variant?.options.find((o) => o.value === sv.optionValue);
    return {
      name: sv.variantName,
      value: option?.label || sv.optionValue,
    };
  });

  const addons = config.selectedAddons.map((sa) => {
    const addon = config.addons.find((a) => a.name === sa.addonName);
    const option = addon?.options.find((o) => o.label === sa.optionLabel);
    return {
      name: sa.addonName,
      option: sa.optionLabel,
      quantity: sa.quantity,
      price: (option?.price || 0) * sa.quantity,
    };
  });

  return {
    variants,
    addons,
    totalPrice: calculateFinalPrice(config),
    availableStock: calculateAvailableStock(config),
  };
}
