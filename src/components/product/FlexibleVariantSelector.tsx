'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Variant, VariantOption, SelectedVariant } from '@/lib/productVariants';

interface FlexibleVariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (selectedVariants: SelectedVariant[]) => void;
  disabled?: boolean;
}

const FlexibleVariantSelector: React.FC<FlexibleVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
  disabled = false
}) => {
  const [localSelectedVariants, setLocalSelectedVariants] = useState<SelectedVariant[]>(selectedVariants);

  useEffect(() => {
    setLocalSelectedVariants(selectedVariants);
  }, [selectedVariants]);

  const handleVariantSelection = (variantName: string, optionValue: string) => {
    if (disabled) return;

    const updatedVariants = localSelectedVariants.filter(sv => sv.variantName !== variantName);
    updatedVariants.push({ variantName, optionValue });
    
    setLocalSelectedVariants(updatedVariants);
    onVariantChange(updatedVariants);
  };

  const getSelectedOption = (variantName: string): VariantOption | null => {
    const selectedVariant = localSelectedVariants.find(sv => sv.variantName === variantName);
    if (!selectedVariant) return null;

    const variant = variants.find(v => v.name === variantName);
    if (!variant) return null;

    return variant.options.find(o => o.value === selectedVariant.optionValue) || null;
  };

  const isColorValue = (value: string): boolean => {
    const colorRegex = /^(#([0-9A-F]{3}){1,2}$|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[01]?\d?\d?\s*\))$/i;
    return colorRegex.test(value);
  };

  const renderColorOption = (variant: Variant, option: VariantOption) => {
    const isSelected = getSelectedOption(variant.name)?.value === option.value;
    const isRGB = option.label.toLowerCase() === 'rgb';
    
    return (
      <button
        key={option._id}
        type="button"
        onClick={() => handleVariantSelection(variant.name, option.value)}
        disabled={disabled}
        className={`
          relative w-12 h-12 rounded-full border-2 transition-all duration-200
          ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={option.label}
      >
        <div
          className="w-full h-full rounded-full"
          style={
            isRGB
              ? {
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #4dff88 50%, #6ba8ff 100%)',
                }
              : {
                  backgroundColor: isColorValue(option.value) ? option.value : '#f0f0f0',
                }
          }
        />
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full shadow-md" />
          </div>
        )}
      </button>
    );
  };

  const renderSizeOption = (variant: Variant, option: VariantOption) => {
    const isSelected = getSelectedOption(variant.name)?.value === option.value;
    
    return (
      <Button
        key={option._id}
        type="button"
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => handleVariantSelection(variant.name, option.value)}
        disabled={disabled}
        className={`
          min-w-[3rem] h-10
          ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}
        `}
      >
        {option.label}
      </Button>
    );
  };

  const renderDropdownOption = (variant: Variant, option: VariantOption) => {
    const isSelected = getSelectedOption(variant.name)?.value === option.value;
    
    return (
      <Button
        key={option._id}
        type="button"
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => handleVariantSelection(variant.name, option.value)}
        disabled={disabled}
        className={`
          ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}
        `}
      >
        {option.label}
        {option.priceModifier !== 0 && (
          <span className="ml-1 text-xs">
            ({option.priceModifier > 0 ? '+' : ''}${Math.abs(option.priceModifier)})
          </span>
        )}
      </Button>
    );
  };

  const renderCustomProperties = (option: VariantOption) => {
    if (!option.customProperties || Object.keys(option.customProperties).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-1">
        {Object.entries(option.customProperties).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <Badge variant="secondary" className="text-xs">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {variants.map((variant) => {
        const selectedOption = getSelectedOption(variant.name);
        
        return (
          <div key={variant._id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">
                {variant.name}
                {variant.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {selectedOption && (
                <Badge variant="outline" className="text-xs">
                  {selectedOption.label}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {/* Render options based on variant type */}
              <div className={`
                flex flex-wrap gap-2
                ${variant.type === 'color' ? 'gap-3' : 'gap-2'}
              `}>
                {variant.options.map((option) => {
                  switch (variant.type) {
                    case 'color':
                      return renderColorOption(variant, option);
                    case 'size':
                      return renderSizeOption(variant, option);
                    default:
                      return renderDropdownOption(variant, option);
                  }
                })}
              </div>

              {/* Show custom properties for selected option */}
              {selectedOption && renderCustomProperties(selectedOption)}

              {/* Show SKU if available */}
              {selectedOption?.sku && (
                <div className="text-xs text-gray-500">
                  SKU: {selectedOption.sku}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Validation messages */}
      {variants.some(v => v.required) && (
        <div className="text-xs text-gray-500">
          * Required selections
        </div>
      )}
    </div>
  );
};

export default FlexibleVariantSelector;