'use client';

import React from 'react';
import { SelectedVariant } from '@/lib/productVariants';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface VariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stockModifier: number;
  specifications: Record<string, unknown>[];
  _id: string;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
}

interface Variant {
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: VariantOption[];
  _id: string;
}

interface GroupedVariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (variantName: string, optionValue: string) => void;
}

interface GroupedOption {
  colorLabel: string;
  colorValue: string;
  colorImage?: string;
  sizes: Array<{
    sizeLabel: string;
    sizeValue: string;
    option: VariantOption;
    variantName: string;
  }>;
}

const GroupedVariantSelector: React.FC<GroupedVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
}) => {
  const getSelectedValue = (variantName: string) => {
    const selected = selectedVariants.find((sv) => sv.variantName === variantName);
    return selected?.optionValue || '';
  };

  const getSelectedOption = (variantName: string): VariantOption | null => {
    const selectedValue = getSelectedValue(variantName);
    if (!selectedValue) return null;
    
    const variant = variants.find(v => v.name === variantName);
    if (!variant) return null;
    
    return variant.options.find(o => o.value === selectedValue) || null;
  };

  const isColorValue = (value: string): boolean => {
    const colorRegex = /^(#([0-9A-F]{3}){1,2}$|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[01]?\d?\d?\s*\))$/i;
    return colorRegex.test(value);
  };

  // Group variants by color
  const groupVariantsByColor = (): GroupedOption[] => {
    const grouped: { [key: string]: GroupedOption } = {};
    
    variants.forEach((variant) => {
      variant.options.forEach((option) => {
        // Extract color information from custom properties or option value
        const colorLabel = option.label;
        const colorValue = option.value;
        let sizeLabel = '';
        let sizeValue = '';
        
        // Check if this option has color and size information
        if (option.customProperties) {
          // Look for size information in custom properties
          Object.entries(option.customProperties).forEach(([key, value]) => {
            const keyLower = key.toLowerCase();
            if (keyLower.includes('size') && typeof value === 'string') {
              sizeLabel = value;
              sizeValue = key;
            }
          });
        }
        
        // If it's a color variant, use the color as the grouping key
        if (variant.type === 'color' || variant.name.toLowerCase().includes('color')) {
          // Group by color label
          const groupKey = colorLabel.toLowerCase();
          
          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              colorLabel,
              colorValue,
              colorImage: option.image,
              sizes: []
            };
          }
          
          // Add size information if available
          if (sizeLabel && sizeValue) {
            grouped[groupKey].sizes.push({
              sizeLabel,
              sizeValue,
              option,
              variantName: variant.name
            });
          } else {
            // If no size info, add as a default size
            grouped[groupKey].sizes.push({
              sizeLabel: 'Standard',
              sizeValue: option.value,
              option,
              variantName: variant.name
            });
          }
        }
      });
    });
    
    return Object.values(grouped);
  };

  // Get all custom properties from all options (when no variant selected)
  const getAllCustomProperties = (): Record<string, Set<string>> => {
    const allProperties: Record<string, Set<string>> = {};
    
    variants.forEach((variant) => {
      variant.options.forEach((option) => {
        if (option.customProperties) {
          Object.entries(option.customProperties).forEach(([key, value]) => {
            if (!allProperties[key]) {
              allProperties[key] = new Set();
            }
            allProperties[key].add(typeof value === 'string' ? value : JSON.stringify(value));
          });
        }
      });
    });
    
    return allProperties;
  };

  // Get selected option's custom properties
  const getSelectedCustomProperties = (): Record<string, unknown> => {
    const selectedOptions = selectedVariants.map(sv => getSelectedOption(sv.variantName)).filter(Boolean);
    
    if (selectedOptions.length === 0) return {};
    
    // Merge custom properties from all selected options
    const mergedProperties: Record<string, unknown> = {};
    selectedOptions.forEach(option => {
      if (option?.customProperties) {
        Object.assign(mergedProperties, option.customProperties);
      }
    });
    
    return mergedProperties;
  };

  const renderCustomProperties = (properties: Record<string, unknown> | Record<string, Set<string>>) => {
    if (!properties || Object.keys(properties).length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Properties:</h5>
        <div className="flex flex-wrap gap-2">
          {Object.entries(properties).map(([key, value]) => {
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            if (value instanceof Set) {
              // Multiple values (when no variant selected)
              return Array.from(value).map((val, index) => (
                <Badge key={`${key}-${index}`} variant="outline" className="text-xs">
                  {displayKey}: {val}
                </Badge>
              ));
            } else {
              // Single value (when variant selected)
              return (
                <Badge key={key} variant="secondary" className="text-xs">
                  {displayKey}: {typeof value === 'string' ? value : JSON.stringify(value)}
                </Badge>
              );
            }
          })}
        </div>
      </div>
    );
  };

  const groupedOptions = groupVariantsByColor();
  const hasGroupedOptions = groupedOptions.length > 0;
  
  // If we can't group by color, fall back to regular variant display
  if (!hasGroupedOptions) {
    return (
      <div>
        {variants.map((variant) => {
          const selectedOption = getSelectedOption(variant.name);
          
          return (
            <div key={variant._id} className="mt-6">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                {variant.name}
                {variant.required && <span className="text-red-500 text-sm">*</span>}
              </h4>
              
              <div className="flex gap-3 flex-wrap">
                {variant.options.map((option, index) => {
                  const current = getSelectedValue(variant.name);
                  const isSelected = current === option.value;
                  
                  return (
                    <button
                      key={`${variant.name}-${option.value}-${index}`}
                      className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => onVariantChange(variant.name, isSelected ? '' : option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Show properties */}
              {selectedOption ? (
                selectedOption.customProperties && renderCustomProperties(selectedOption.customProperties)
              ) : (
                renderCustomProperties(getAllCustomProperties())
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Render grouped color/size display
  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-4">Select Color & Size</h4>
      
      <div className="space-y-6">
        {groupedOptions.map((group, groupIndex) => {
          const isRGB = group.colorLabel.toLowerCase() === 'rgb';
          
          return (
            <div key={groupIndex} className="space-y-3">
              {/* Color Display */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                  style={
                    isRGB
                      ? {
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #4dff88 50%, #6ba8ff 100%)',
                        }
                      : {
                          backgroundColor: isColorValue(group.colorValue) ? group.colorValue : '#f0f0f0',
                        }
                  }
                >
                  {group.colorImage && (
                    <Image
                      src={getImageUrl(group.colorImage)}
                      alt={group.colorLabel}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  )}
                </div>
                <span className="font-medium text-gray-900">{group.colorLabel}</span>
              </div>
              
              {/* Size Tags */}
              <div className="ml-11 flex flex-wrap gap-2">
                {group.sizes.map((size, sizeIndex) => {
                  const isSelected = selectedVariants.some(
                    sv => sv.variantName === size.variantName && sv.optionValue === size.option.value
                  );
                  
                  return (
                    <button
                      key={sizeIndex}
                      className={`px-3 py-1.5 text-sm border rounded-md transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                      onClick={() => {
                        onVariantChange(size.variantName, isSelected ? '' : size.option.value);
                      }}
                    >
                      {size.sizeLabel}
                      {size.option.priceModifier !== 0 && (
                        <span className="ml-1 text-xs">
                          ({size.option.priceModifier > 0 ? '+' : ''}Rs.{size.option.priceModifier})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Properties Display */}
      {selectedVariants.length > 0 ? (
        renderCustomProperties(getSelectedCustomProperties())
      ) : (
        renderCustomProperties(getAllCustomProperties())
      )}
      
      {/* SKU and Price Info */}
      {selectedVariants.length > 0 && (
        <div className="mt-4 space-y-1">
          {selectedVariants.map(sv => {
            const option = getSelectedOption(sv.variantName);
            if (!option) return null;
            
            return (
              <div key={sv.variantName} className="text-xs text-gray-500">
                {option.sku && <div>SKU: {option.sku}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupedVariantSelector;