'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Tag, Settings } from 'lucide-react';

interface VariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stockModifier: number;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications?: { name: string; value: string }[];
}

interface Variant {
  _id: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: VariantOption[];
}

interface FlexibleVariantSummaryProps {
  variants: Variant[];
  className?: string;
}

const FlexibleVariantSummary: React.FC<FlexibleVariantSummaryProps> = ({ variants, className = '' }) => {
  if (!variants || variants.length === 0) {
    return null;
  }

  const totalOptions = variants.reduce((sum, variant) => sum + variant.options.length, 0);
  const totalCustomProperties = variants.reduce((sum, variant) => 
    sum + variant.options.reduce((optionSum, option) => 
      optionSum + (option.customProperties ? Object.keys(option.customProperties).length : 0), 0
    ), 0
  );
  const totalSKUs = variants.reduce((sum, variant) => 
    sum + variant.options.filter(option => option.sku).length, 0
  );
  const hasFlexibleProperties = totalCustomProperties > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5" />
          Flexible Variant System
          {hasFlexibleProperties && (
            <Badge variant="default" className="bg-green-600">
              Enhanced
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{variants.length}</div>
            <div className="text-xs text-gray-600">Variants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalOptions}</div>
            <div className="text-xs text-gray-600">Options</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalCustomProperties}</div>
            <div className="text-xs text-gray-600">Custom Props</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalSKUs}</div>
            <div className="text-xs text-gray-600">SKUs</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Flexible custom properties for any data</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Automatic SKU generation and management</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-purple-600" />
            <span>Enhanced product specifications</span>
          </div>
        </div>

        {/* Variant Types */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Variant Types:</div>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Badge key={variant._id} variant="outline" className="text-xs">
                {variant.name} ({variant.type})
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Properties Preview */}
        {hasFlexibleProperties && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Properties Found:</div>
            <div className="flex flex-wrap gap-1">
              {variants.map((variant) =>
                variant.options.map((option) =>
                  option.customProperties
                    ? Object.keys(option.customProperties).map((key) => (
                        <Badge key={`${variant._id}-${option._id}-${key}`} variant="secondary" className="text-xs">
                          {key.replace(/_/g, ' ')}
                        </Badge>
                      ))
                    : null
                )
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlexibleVariantSummary;