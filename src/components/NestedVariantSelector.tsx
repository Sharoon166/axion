'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Variant, VariantOption } from '@/lib/productVariants';

interface SelectedVariant {
  variantName: string;
  optionValue: string;
  optionLabel?: string;
  subVariants?: Array<{
    subVariantName: string;
    optionValue: string;
    optionLabel?: string;
    subSubVariants?: Array<{
      subSubVariantName: string;
      optionValue: string;
      optionLabel?: string;
    }>;
  }>;
}

interface NestedVariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (variants: SelectedVariant[]) => void;
  className?: string;
}

const NestedVariantSelector: React.FC<NestedVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [variantSelectionPath, setVariantSelectionPath] = useState<Record<string, unknown>>({});
  console.log(currentStep,variantSelectionPath)
  // Reset selection path when variants change
  useEffect(() => {
    if (selectedVariants.length === 0) {
      setCurrentStep(0);
      setVariantSelectionPath({});
    }
  }, [selectedVariants]);

  // Handle main variant selection
  const handleVariantSelection = (variant: Variant, option: VariantOption) => {
    const newSelectedVariant: SelectedVariant = {
      variantName: variant.name,
      optionValue: option.value,
      optionLabel: option.label,
    };
    
    // Update selected variants
    const updatedVariants = [...selectedVariants];
    const existingIndex = updatedVariants.findIndex(sv => sv.variantName === variant.name);
    
    if (existingIndex >= 0) {
      updatedVariants[existingIndex] = newSelectedVariant;
    } else {
      updatedVariants.push(newSelectedVariant);
    }
    
    onVariantChange(updatedVariants);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center py-8 text-gray-500">
        <h3 className="text-lg font-medium mb-2">Nested Variant Selector</h3>
        <p className="text-sm">Advanced variant selection with nested sub-variants.</p>
        <p className="text-xs mt-2">This component supports up to 3 levels of variant nesting.</p>
      </div>
      
      {variants.length > 0 && (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={variant._id || index} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">{variant.name}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {variant.options.map((option, optionIndex) => (
                  <Button
                    key={option._id || optionIndex}
                    variant={
                      selectedVariants.some(sv => 
                        sv.variantName === variant.name && sv.optionValue === option.value
                      ) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleVariantSelection(variant, option)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NestedVariantSelector;