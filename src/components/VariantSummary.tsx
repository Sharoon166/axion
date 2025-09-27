'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SelectedVariant } from '@/lib/productVariants';

interface VariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stockModifier: number;
  _id: string;
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

interface VariantSummaryProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  className?: string;
}

const VariantSummary: React.FC<VariantSummaryProps> = ({
  variants,
  selectedVariants,
  className = ''
}) => {
  if (!selectedVariants || selectedVariants.length === 0) {
    return null;
  }

  const getSelectedOptionDetails = (variantName: string, optionValue: string) => {
    const variant = variants.find(v => v.name === variantName);
    if (!variant) return null;
    
    return variant.options.find(o => o.value === optionValue) || null;
  };

  const totalPriceModifier = selectedVariants.reduce((total, sv) => {
    const option = getSelectedOptionDetails(sv.variantName, sv.optionValue);
    return total + (option?.priceModifier || 0);
  }, 0);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h6 className="font-medium mb-3 text-sm">Selected Configuration</h6>
        
        <div className="space-y-3">
          {selectedVariants.map((sv) => {
            const option = getSelectedOptionDetails(sv.variantName, sv.optionValue);
            if (!option) return null;

            return (
              <div key={`${sv.variantName}-${sv.optionValue}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sv.variantName}:</span>
                    <Badge variant="outline" className="text-xs">
                      {option.label}
                    </Badge>
                    {option.priceModifier !== 0 && (
                      <Badge variant={option.priceModifier > 0 ? 'default' : 'secondary'} className="text-xs">
                        {option.priceModifier > 0 ? '+' : ''}Rs.{option.priceModifier}
                      </Badge>
                    )}
                  </div>
                  {option.sku && (
                    <span className="text-xs text-gray-500">SKU: {option.sku}</span>
                  )}
                </div>

                {/* Custom Properties */}
                {option.customProperties && Object.keys(option.customProperties).length > 0 && (
                  <div className="ml-4 space-y-1">
                    {Object.entries(option.customProperties).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Price Modifier */}
        {totalPriceModifier !== 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Variant Price Adjustment:</span>
              <Badge variant={totalPriceModifier > 0 ? 'default' : 'secondary'}>
                {totalPriceModifier > 0 ? '+' : ''}Rs.{totalPriceModifier}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariantSummary;