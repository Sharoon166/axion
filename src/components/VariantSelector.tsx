'use client';

import React from 'react';
import { Variant, SelectedVariant } from '@/lib/productVariants';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (variantName: string, optionValue: string) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
}) => {
  const getSelectedValue = (variantName: string) => {
    const selected = selectedVariants.find((sv) => sv.variantName === variantName);
    return selected?.optionValue || '';
  };

  const isColorVariant = (variant: Variant) => {
    const name = (variant.name || '').toLowerCase();
    if (variant.type === 'color') return true;
    return name.includes('color') || name.includes('colour');
  };

  const renderColorVariant = (variant: Variant) => (
    <div key={variant.name} className="mt-6">
      <h4 className="font-semibold flex items-center gap-2">
        {variant.name}
        {variant.required && <span className="text-red-500 text-sm">*</span>}
      </h4>
      <div className="flex gap-3 mt-2 flex-wrap">
        {variant.options.map((option, index) => {
          const current = getSelectedValue(variant.name);
          const isSelected = current === option.value;
          const isRGB = (option.label || '').trim().toLowerCase() === 'rgb' || (option.value || '').trim().toLowerCase() === 'rgb';
          return (
            <button
              key={`${variant.name}-${option.value}-${index}`}
              className={`w-12 h-12 rounded-full border-2 shadow-md hover:scale-110 transition-all duration-200 relative ${
                isSelected
                  ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={
                isRGB
                  ? {
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #4dff88 50%, #6ba8ff 100%)',
                    }
                  : {
                      backgroundColor: option.value,
                      boxShadow:
                        option.value === '#ffffff' || option.value === 'white'
                          ? 'inset 0 0 0 1px #e5e7eb'
                          : undefined,
                    }
              }
              onClick={() => onVariantChange(variant.name, isSelected ? '' : option.value)}
              aria-pressed={isSelected}
              title={`${variant.name}: ${option.label}`}
            >
              {option.image && (
                <Image
                  src={getImageUrl(option.image)}
                  alt={option.label}
                  fill
                  className="rounded-full object-cover"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSizeVariant = (variant: Variant) => (
    <div key={variant.name} className="mt-6">
      <h4 className="font-semibold flex items-center gap-2">
        {variant.name}
        {variant.required && <span className="text-red-500 text-sm">*</span>}
      </h4>
      <div className="flex gap-3 mt-2 flex-wrap">
        {variant.options.map((option, index) => {
          const current = getSelectedValue(variant.name);
          const isSelected = current === option.value;
          return (
            <button
              key={`${variant.name}-${option.value}-${index}`}
              className={`px-4 py-2 border rounded-lg relative transition-all duration-200 ${
                isSelected
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => onVariantChange(variant.name, isSelected ? '' : option.value)}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTextVariant = (variant: Variant) => (
    <div key={variant.name} className="mt-6">
      <h4 className="font-semibold flex items-center gap-2 mb-2">
        {variant.name}
        {variant.required && <span className="text-red-500 text-sm">*</span>}
      </h4>
      <input
        type="text"
        value={getSelectedValue(variant.name)}
        onChange={(e) => onVariantChange(variant.name, e.target.value)}
        placeholder={`Enter ${variant.name.toLowerCase()}`}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      {variants.map((variant) => {
        if (isColorVariant(variant)) return renderColorVariant(variant);
        switch (variant.type) {
          case 'size':
            return renderSizeVariant(variant);
          case 'text':
            return renderTextVariant(variant);
          case 'dropdown':
          default:
            // Render dropdown-type variants as tag-style buttons to remove dropdowns
            return renderSizeVariant(variant);
        }
      })}
    </div>
  );
};

export default VariantSelector;
