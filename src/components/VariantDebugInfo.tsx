'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface VariantDebugInfoProps {
  variants: Variant[];
  className?: string;
}

const VariantDebugInfo: React.FC<VariantDebugInfoProps> = ({ variants, className = '' }) => {
  if (!variants || variants.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Variant Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No variants found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Variant Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant) => (
          <div key={variant._id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {variant.name}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {variant.type}
              </Badge>
              {variant.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              {variant.options.map((option) => (
                <div key={option._id} className="bg-gray-50 rounded p-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-gray-500">({option.value})</span>
                    {option.sku && (
                      <Badge variant="outline" className="text-xs">
                        SKU: {option.sku}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span>Price: {option.priceModifier >= 0 ? '+' : ''}Rs.{option.priceModifier}</span>
                    <span>Stock: {option.stockModifier}</span>
                  </div>
                  
                  {/* Custom Properties */}
                  {option.customProperties && Object.keys(option.customProperties).length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-700">Custom Properties:</div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(option.customProperties).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <span className="font-medium capitalize text-gray-600">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Legacy Specifications */}
                  {option.specifications && option.specifications.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-700">Specifications:</div>
                      <div className="grid grid-cols-1 gap-1">
                        {option.specifications.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-600">{spec.name}:</span>
                            <Badge variant="outline" className="text-xs">
                              {spec.value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VariantDebugInfo;