'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';

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
  options: VariantOption[];
  _id: string;
}

interface VariantRelationshipDisplayProps {
  variants: Variant[];
  selectedVariants: Array<{ variantName: string; optionValue: string }>;
}

const VariantRelationshipDisplay: React.FC<VariantRelationshipDisplayProps> = ({
  variants,
  selectedVariants,
}) => {
  const getSelectedOption = (variantName: string): VariantOption | null => {
    const selectedVariant = selectedVariants.find(sv => sv.variantName === variantName);
    if (!selectedVariant) return null;
    
    const variant = variants.find(v => v.name === variantName);
    if (!variant) return null;
    
    return variant.options.find(o => o.value === selectedVariant.optionValue) || null;
  };

  const findRelatedOptions = (selectedOption: VariantOption, sourceVariantName: string): Array<{
    variant: Variant;
    option: VariantOption;
    relationship: string;
  }> => {
    const related: Array<{
      variant: Variant;
      option: VariantOption;
      relationship: string;
    }> = [];

    variants.forEach(variant => {
      if (variant.name === sourceVariantName) return;

      variant.options.forEach(option => {
        if (!option.customProperties) return;

        // Check for direct property matches
        Object.entries(option.customProperties).forEach(([key, value]) => {
          const keyLower = key.toLowerCase();
          const valueLower = (typeof value === 'string' ? value : String(value)).toLowerCase();
          const selectedLabel = selectedOption.label.toLowerCase();
          const selectedValue = selectedOption.value.toLowerCase();

          // Check if this option's properties relate to the selected option
          if (keyLower.includes(selectedLabel) || 
              keyLower.includes(selectedValue) ||
              valueLower.includes(selectedLabel) ||
              valueLower.includes(selectedValue)) {
            
            related.push({
              variant,
              option,
              relationship: `${key}: ${value}`
            });
          }
        });

        // Check if selected option has properties that match this option
        if (selectedOption.customProperties) {
          Object.entries(selectedOption.customProperties).forEach(([key, value]) => {
            const keyLower = key.toLowerCase();
            const valueLower = (typeof value === 'string' ? value : String(value)).toLowerCase();
            const optionLabel = option.label.toLowerCase();
            const optionValue = option.value.toLowerCase();

            if (keyLower.includes(optionLabel) || 
                keyLower.includes(optionValue) ||
                valueLower.includes(optionLabel) ||
                valueLower.includes(optionValue)) {
              
              // Avoid duplicates
              const exists = related.some(r => 
                r.variant._id === variant._id && r.option._id === option._id
              );
              
              if (!exists) {
                related.push({
                  variant,
                  option,
                  relationship: `${key}: ${value}`
                });
              }
            }
          });
        }
      });
    });

    return related;
  };

  const getAllProperties = (): Record<string, Array<{ variant: string; option: string; value: unknown }>> => {
    const allProps: Record<string, Array<{ variant: string; option: string; value: unknown }>> = {};

    variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.customProperties) {
          Object.entries(option.customProperties).forEach(([key, value]) => {
            if (!allProps[key]) {
              allProps[key] = [];
            }
            allProps[key].push({
              variant: variant.name,
              option: option.label,
              value
            });
          });
        }
      });
    });

    return allProps;
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  const selectedOptions = selectedVariants
    .map(sv => ({
      variantName: sv.variantName,
      option: getSelectedOption(sv.variantName)
    }))
    .filter(item => item.option !== null);

  const allProperties = getAllProperties();

  return (
    <div className="space-y-6">
      {/* Selected Variants and Their Relationships */}
      {selectedOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Selected Variants & Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOptions.map(({ variantName, option }, index) => {
              if (!option) return null;
              
              const relatedOptions = findRelatedOptions(option, variantName);

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default" className="font-medium">
                      {variantName}: {option.label}
                    </Badge>
                    {option.sku && (
                      <Badge variant="outline" className="text-xs">
                        {option.sku}
                      </Badge>
                    )}
                  </div>

                  {/* Direct Properties */}
                  {option.customProperties && Object.keys(option.customProperties).length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium mb-2">Properties:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(option.customProperties).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                            <span className="font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Options */}
                  {relatedOptions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Related Options:
                      </h5>
                      <div className="space-y-2">
                        {relatedOptions.map((related, relIndex) => (
                          <div key={relIndex} className="flex items-center justify-between text-sm bg-blue-50 rounded p-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {related.variant.name}
                              </Badge>
                              <span>{related.option.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {related.relationship}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Properties Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(allProperties).length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No custom properties found in variants
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(allProperties).map(([propertyName, instances]) => (
                <div key={propertyName} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 capitalize">
                    {propertyName.replace(/_/g, ' ')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {instances.map((instance, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {instance.variant}
                          </Badge>
                          <span className="text-xs">{instance.option}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {typeof instance.value === 'string' ? instance.value : JSON.stringify(instance.value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VariantRelationshipDisplay;